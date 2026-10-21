"""Windroida datasheet: a clean admin view of the database.  Run:  python datasheet.py

Reads the same SQLite file as the server (WAL mode, so both can run together).
Passwords / security answers are only ever stored as salted scrypt hashes and are shown masked.
"""
import csv
import os
import shutil
import subprocess
import sys
import secrets
import string
import time
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

import common
import ui_kit
from client_core import load_config, save_config
from common import (connect_db, hash_secret, migrate_legacy_uploads, now, remove_upload, resolve_upload,
                    resolve_avatar, avatar_folder_for_user, avatar_folder_for_chat)
from ui_kit import (T, Dialog, FlatButton, fa, font, gregorian_to_jalali, init_fonts, make_entry, set_theme)

import datetime


def fmt_dt(ts):
    if not ts:
        return "—"
    d = datetime.datetime.fromtimestamp(ts)
    jy, jm, jd = gregorian_to_jalali(d.year, d.month, d.day)
    return fa(f"{jy}/{jm:02d}/{jd:02d}  {d:%H:%M}")


def iso(ts):
    return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S") if ts else ""


def clip(text, n):
    text = " ".join(str(text or "").split())
    return text if len(text) <= n else text[:n - 1] + "…"


TABS = ["users", "chats", "messages", "files", "profiles", "rooms", "songs", "walls", "userwalls"]
TAB_TITLES = {"users": "👤  کاربران", "chats": "💬  چت‌ها و گروه‌ها", "messages": "✉  پیام‌ها", "files": "📁  فایل‌ها", "profiles": "🖼  پروفایل‌ها", "rooms": "🎬  اتاق‌ها", "songs": "🎵  آهنگ‌های اتاق", "walls": "🎨  پس‌زمینه‌ها", "userwalls": "🖌  پس‌زمینه کاربرها"}

COLUMNS = {
    "users": [("id", "ID", 56, "e"), ("username", "نام کاربری", 130, "w"), ("name", "نام نمایشی", 150, "w"),
              ("question", "سوال امنیتی", 210, "w"), ("hash", "هش رمز (scrypt)", 120, "w"),
              ("created", "ثبت‌نام", 130, "w"), ("seen", "آخرین بازدید", 130, "w"), ("chats", "چت", 50, "e"),
              ("msgs", "پیام", 56, "e"), ("status", "وضعیت", 80, "w")],
    "chats": [("id", "ID", 56, "e"), ("kind", "نوع", 80, "w"), ("title", "عنوان", 190, "w"),
              ("members", "اعضا", 260, "w"), ("owner", "سازنده", 110, "w"), ("count", "تعداد اعضا", 80, "e"),
              ("msgs", "پیام", 60, "e"), ("last", "آخرین پیام", 140, "w"), ("created", "ساخته‌شده", 140, "w")],
    "messages": [("id", "ID", 64, "e"), ("chat", "چت", 170, "w"), ("sender", "فرستنده", 110, "w"),
                 ("kind", "نوع", 64, "w"), ("text", "متن", 380, "w"), ("file", "فایل", 150, "w"),
                 ("time", "زمان", 140, "w"), ("state", "وضعیت", 90, "w")],
    "files": [("id", "ID", 56, "e"), ("folder", "پوشه", 300, "w"), ("name", "نام فایل", 220, "w"),
              ("ext", "نوع", 60, "w"), ("size", "حجم", 80, "e"), ("sender", "فرستنده", 100, "w"),
              ("time", "زمان آپلود", 140, "w"), ("state", "روی دیسک", 80, "w")],
    "profiles": [("id", "ID", 56, "e"), ("kind", "نوع", 70, "w"), ("name", "نام", 150, "w"),
                 ("photo", "عکس فعلی", 190, "w"), ("count", "تعداد عکس‌ها", 90, "e"), ("size", "حجم کل", 80, "e"),
                 ("folder", "پوشه", 260, "w"), ("time", "آخرین تغییر", 140, "w"), ("state", "روی دیسک", 80, "w")],
    "rooms": [("n", "#", 46, "e"), ("title", "اتاق", 170, "w"), ("kind", "نوع", 90, "w"), ("owner", "سازنده", 110, "w"),
              ("now", "الان", 60, "e"), ("peak", "حداکثر", 60, "e"), ("members", "حاضرین", 200, "w"), ("cur", "در حال پخش", 170, "w"),
              ("songs", "آهنگ/فایل", 70, "e"), ("invites", "دعوت", 50, "e"), ("time", "شروع", 140, "w"), ("state", "وضعیت", 90, "w")],
    "songs": [("n", "#", 50, "e"), ("name", "آهنگ", 260, "w"), ("folder", "پلی‌لیست / پوشه", 230, "w"), ("size", "حجم", 90, "e"),
              ("time", "آخرین تغییر", 150, "w"), ("state", "وضعیت", 160, "w")],
    "userwalls": [("n", "#", 46, "e"), ("user", "کاربر", 150, "w"), ("count", "تعداد عکس‌ها", 90, "e"), ("dim", "ابعاد فعلی", 110, "w"),
                  ("size", "حجم کل", 80, "e"), ("folder", "پوشه", 300, "w"), ("time", "آخرین تغییر", 140, "w"), ("state", "وضعیت", 120, "w")],
    "walls": [("n", "#", 50, "e"), ("name", "نام فایل", 300, "w"), ("dim", "ابعاد", 110, "w"), ("size", "حجم", 90, "e"),
              ("time", "آخرین تغییر", 150, "w"), ("state", "وضعیت", 220, "w")],
}


class Datasheet(tk.Tk):
    def __init__(self, db_path=None):
        super().__init__()
        init_fonts(self)
        self.cfg = load_config()
        set_theme(self.cfg.get("theme", "dark"))
        self.db_path = db_path or common.DB_PATH
        self.db = connect_db(self.db_path)
        migrate_legacy_uploads(self.db)
        self.title("Windroida Datasheet")
        self.geometry("1240x740")
        self.minsize(980, 520)
        self.configure(bg=T["bg"])
        self.tab = "users"
        self.rows = []
        self.sort = {t: ("id", False) for t in TABS}
        self.sort["walls"] = self.sort["songs"] = self.sort["userwalls"] = ("n", False)
        self.sort["rooms"] = ("n", True)
        self.sort["files"] = ("folder", False)
        self.last_signature = None
        self.toast_job = None
        self._style()
        self._build()
        self.switch_tab("users")
        self.after(2500, self._auto)

    # ----------------------------------------------------------------- UI
    def _style(self):
        st = ttk.Style(self)
        try:
            st.theme_use("clam")
        except tk.TclError:
            pass
        st.configure("Treeview", background=T["side"], fieldbackground=T["side"], foreground=T["text"],
                     rowheight=32, borderwidth=0, font=font(10), relief="flat",
                     bordercolor=T["side"], lightcolor=T["side"], darkcolor=T["side"])
        st.configure("Treeview.Heading", background=T["head"], foreground=T["muted"], relief="flat",
                     font=font(9, "bold"), padding=(8, 8), borderwidth=0)
        st.map("Treeview", background=[("selected", T["sel"])], foreground=[("selected", T["sel_text"])])
        st.map("Treeview.Heading", background=[("active", T["hover"])])
        for orient in ("Vertical", "Horizontal"):
            st.configure(f"{orient}.TScrollbar", background=T["head"], troughcolor=T["side"], bordercolor=T["side"],
                         arrowcolor=T["muted"], relief="flat", gripcount=0)

    def _build(self):
        head = tk.Frame(self, bg=T["bg"])
        head.pack(fill="x", padx=22, pady=(16, 4))
        tk.Label(head, text="Datasheet", bg=T["bg"], fg=T["text"], font=font(18, "bold")).pack(side="left")
        tk.Label(head, text=f"   {self.db_path}", bg=T["bg"], fg=T["muted"], font=font(9)).pack(side="left", pady=(8, 0))
        theme = tk.Label(head, text="◐ تم", bg=T["bg"], fg=T["muted"], font=font(10), cursor="hand2")
        theme.pack(side="right")
        theme.bind("<Button-1>", lambda e: self.toggle_theme())

        self.cards = tk.Frame(self, bg=T["bg"])
        self.cards.pack(fill="x", padx=18, pady=(6, 8))
        self.card_vals = {}
        for key, label in (("users", "کاربران"), ("banned", "مسدود"), ("chats", "چت خصوصی"),
                           ("groups", "گروه"), ("msgs", "پیام"), ("files", "فایل‌ها"), ("avatars", "عکس پروفایل")):
            c = tk.Frame(self.cards, bg=T["side"], padx=16, pady=10)
            c.pack(side="left", expand=True, fill="x", padx=4)
            v = tk.Label(c, text="0", bg=T["side"], fg=T["accent"], font=font(18, "bold"), anchor="w")
            v.pack(fill="x")
            tk.Label(c, text=label, bg=T["side"], fg=T["muted"], font=font(9), anchor="w").pack(fill="x")
            self.card_vals[key] = v

        tabs = tk.Frame(self, bg=T["bg"])
        tabs.pack(fill="x", padx=22, pady=(4, 0))
        self.tab_btns = {}
        for t in TABS:
            b = tk.Label(tabs, text=TAB_TITLES[t], bg=T["bg"], fg=T["muted"], font=font(11, "bold"), cursor="hand2",
                         padx=14, pady=8)
            b.pack(side="left")
            b.bind("<Button-1>", lambda e, tt=t: self.switch_tab(tt))
            self.tab_btns[t] = b

        bar = tk.Frame(self, bg=T["side"])
        bar.pack(fill="x", padx=18, pady=(0, 0))
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self.render())
        tk.Label(bar, text="🔍", bg=T["side"], fg=T["muted"], font=font(11)).pack(side="left", padx=(12, 4))
        make_entry(bar, textvariable=self.search_var, width=28).pack(side="left", ipady=5, pady=10)
        self.auto_var = tk.IntVar(value=1)
        tk.Checkbutton(bar, text="بروزرسانی خودکار", variable=self.auto_var, bg=T["side"], fg=T["muted"],
                       selectcolor=T["entry"], activebackground=T["side"], activeforeground=T["text"], bd=0,
                       highlightthickness=0, font=font(9)).pack(side="left", padx=12)
        self.actions = tk.Frame(bar, bg=T["side"])
        self.actions.pack(side="right", padx=8)

        body = tk.Frame(self, bg=T["side"])
        body.pack(fill="both", expand=True, padx=18)
        self.tree = ttk.Treeview(body, show="headings", selectmode="extended")
        vs = ttk.Scrollbar(body, orient="vertical", command=self.tree.yview)
        hs = ttk.Scrollbar(body, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vs.set, xscrollcommand=hs.set)
        vs.pack(side="right", fill="y")
        hs.pack(side="bottom", fill="x")
        self.tree.pack(fill="both", expand=True)
        self.tree.tag_configure("odd", background=T["stripe"])
        self.tree.tag_configure("bad", foreground=T["danger"])
        self.tree.tag_configure("dim", foreground=T["muted"])
        self.tree.bind("<Double-Button-1>", lambda e: self.show_detail())
        self.tree.bind("<Button-3>", self.context_menu)
        self.tree.bind("<Delete>", lambda e: self.act_delete())
        self.tree.bind("<<TreeviewSelect>>", lambda e: self.update_status())

        self.status = tk.Label(self, text="", bg=T["bg"], fg=T["muted"], font=font(9), anchor="w")
        self.status.pack(fill="x", padx=22, pady=(6, 8))

    def toggle_theme(self):
        self.cfg["theme"] = "light" if self.cfg.get("theme", "dark") == "dark" else "dark"
        save_config(self.cfg)
        set_theme(self.cfg["theme"])
        for w in self.winfo_children():
            w.destroy()
        self.configure(bg=T["bg"])
        self._style()
        self._build()
        self.last_signature = None
        self.switch_tab(self.tab)

    def toast(self, text, error=False):
        self.status.configure(text=text, fg=T["danger"] if error else T["ok"])
        if self.toast_job:
            self.after_cancel(self.toast_job)
        self.toast_job = self.after(4000, self.update_status)

    # --------------------------------------------------------------- tabs
    def switch_tab(self, tab):
        self.tab = tab
        for t, b in self.tab_btns.items():
            b.configure(fg=T["accent"] if t == tab else T["muted"], bg=T["side"] if t == tab else T["bg"])
        cols = COLUMNS[tab]
        self.tree.configure(columns=[c[0] for c in cols])
        for key, title, width, anchor in cols:
            self.tree.heading(key, text=title, command=lambda k=key: self.sort_by(k))
            self.tree.column(key, width=width, anchor=anchor, stretch=key in ("text", "members", "question", "title"))
        for w in self.actions.winfo_children():
            w.destroy()
        buttons = {"users": [("مسدود / رفع مسدودی", self.act_ban, "soft"), ("رفع قفل", self.act_unlock, "soft"),
                             ("ریست رمز", self.act_reset_pw, "soft"), ("حذف کاربر", self.act_delete, "danger")],
                   "chats": [("حذف چت", self.act_delete, "danger")],
                   "messages": [("حذف پیام", self.act_delete, "danger")],
                   "files": [("باز کردن فایل", self.act_open_file, "soft"), ("نمایش در پوشه", self.act_open_folder, "soft"),
                             ("ذخیره کپی…", self.act_save_copy, "soft"), ("حذف فایل", self.act_delete, "danger")],
                   "profiles": [("باز کردن عکس", self.act_open_avatar, "soft"), ("پوشه عکس‌های این پروفایل", self.act_open_avatar_folder, "soft"),
                                ("📁 پوشه همه پروفایل‌ها", lambda: self.open_path(self._avatars_root()), "soft"),
                                ("برداشتن عکس از پروفایل", self.act_clear_avatar, "soft")],
                   "rooms": [],
                   "songs": [("➕ افزودن آهنگ…", self.act_add_songs, "primary"), ("📁 پوشه roomaudio", lambda: self.open_path(self._songs_root()), "soft"),
                             ("پوشه همین آهنگ", self.act_open_song_folder, "soft"), ("حذف", self.act_delete, "danger")],
                   "userwalls": [("باز کردن عکس فعلی", self.act_open_userwall, "soft"), ("پوشه این کاربر", self.act_open_userwall_folder, "soft"),
                                 ("📁 پوشه همه کاربرها", lambda: self.open_path(self._userwalls_root()), "soft"),
                                 ("برداشتن پس‌زمینه کاربر", self.act_clear_userwall, "soft")],
                   "walls": [("➕ افزودن عکس…", self.act_add_walls, "primary"), ("📁 پوشه پس‌زمینه‌ها", lambda: self.open_path(self._walls_root()), "soft"),
                             ("باز کردن عکس", self.act_open_wall, "soft"), ("حذف", self.act_delete, "danger")]}[tab]
        if tab == "files":
            buttons.insert(2, ("📁 پوشه آپلودها", lambda: self.open_path(common.UPLOADS_DIR), "soft"))
        buttons += [("جزئیات", self.show_detail, "soft"), ("خروجی CSV", self.export_csv, "primary"),
                    ("↻", self.refresh, "soft")]
        for text, cmd, kind in buttons:
            FlatButton(self.actions, text, cmd, kind=kind, padx=12, pady=5, font=font(9, "bold")).pack(
                side="left", padx=3, pady=8)
        self.last_signature = None
        self.refresh()

    def sort_by(self, key):
        col, rev = self.sort[self.tab]
        self.sort[self.tab] = (key, not rev if key == col else False)
        self.render()

    # --------------------------------------------------------------- data
    def refresh(self):
        self.stats()
        loader = {"users": self.load_users, "chats": self.load_chats, "messages": self.load_messages,
                  "files": self.load_files, "profiles": self.load_profiles, "rooms": self.load_rooms, "songs": self.load_songs, "walls": self.load_walls, "userwalls": self.load_userwalls}[self.tab]
        rows = loader()
        sig = (self.tab, tuple((r["iid"], r["display"]) for r in rows))
        if sig == self.last_signature:
            return
        self.last_signature = sig
        self.rows = rows
        self.render()

    def stats(self):
        q = lambda sql: self.db.execute(sql).fetchone()[0]
        total_size = q("SELECT IFNULL(SUM(file_size),0) FROM messages WHERE kind='file' AND deleted=0")
        self.card_vals["users"].configure(text=fa(q("SELECT COUNT(*) FROM users")))
        self.card_vals["banned"].configure(text=fa(q("SELECT COUNT(*) FROM users WHERE banned=1")))
        self.card_vals["chats"].configure(text=fa(q("SELECT COUNT(*) FROM chats WHERE kind='private'")))
        self.card_vals["groups"].configure(text=fa(q("SELECT COUNT(*) FROM chats WHERE kind='group'")))
        self.card_vals["msgs"].configure(text=fa(q("SELECT COUNT(*) FROM messages WHERE kind!='system'")))
        self.card_vals["avatars"].configure(text=fa(q("SELECT COUNT(*) FROM users WHERE avatar IS NOT NULL")))
        n_files = q("SELECT COUNT(*) FROM messages WHERE kind='file' AND deleted=0")
        self.card_vals["files"].configure(text=f"{fa(n_files)}  ·  {total_size / 1048576:.1f} MB" if n_files else "۰")

    def load_users(self):
        out = []
        for r in self.db.execute(
                "SELECT u.*, (SELECT COUNT(*) FROM members m WHERE m.user_id=u.id) AS chats_n, "
                "(SELECT COUNT(*) FROM messages g WHERE g.sender_id=u.id AND g.kind!='system') AS msgs_n "
                "FROM users u ORDER BY u.id"):
            status = "مسدود" if r["banned"] else ("قفل" if r["locked_until"] > now() else "فعال")
            masked = bytes(r["pw_hash"]).hex()[:10] + "…"
            disp = (r["id"], r["username"], r["display_name"], clip(r["sec_question"], 34), masked,
                    fmt_dt(r["created_at"]), fmt_dt(r["last_seen"]), r["chats_n"], r["msgs_n"], status)
            out.append(dict(iid=str(r["id"]), display=disp,
                            sort=(r["id"], r["username"].lower(), r["display_name"].lower(), r["sec_question"],
                                  masked, r["created_at"], r["last_seen"] or 0, r["chats_n"], r["msgs_n"], status),
                            export=(r["id"], r["username"], r["display_name"], r["sec_question"], masked,
                                    iso(r["created_at"]), iso(r["last_seen"]), r["chats_n"], r["msgs_n"], status),
                            tags=("bad",) if r["banned"] else (),
                            detail=[("ID", r["id"]), ("نام کاربری", r["username"]), ("نام نمایشی", r["display_name"]),
                                    ("بیو", r["bio"] or "—"), ("سوال امنیتی", r["sec_question"]),
                                    ("جواب امنیتی", "🔒 فقط به‌صورت هش ذخیره شده"),
                                    ("هش رمز", bytes(r["pw_hash"]).hex() + "\n(scrypt + salt یکتا؛ از روی هش نمی‌شه رمز اصلی رو فهمید. برای دادن رمز جدید «ریست رمز» رو بزن.)"),
                                    ("ثبت‌نام", fmt_dt(r["created_at"])), ("آخرین بازدید", fmt_dt(r["last_seen"])),
                                    ("تلاش ناموفق پشت‌سرهم", r["failed_logins"]),
                                    ("قفل تا", fmt_dt(r["locked_until"]) if r["locked_until"] > now() else "—"),
                                    ("وضعیت", status)]))
        return out

    def load_chats(self):
        out = []
        for r in self.db.execute(
                "SELECT c.*, o.username AS owner_name, "
                "(SELECT group_concat(u.username, ' ↔ ') FROM members m JOIN users u ON u.id=m.user_id "
                "  WHERE m.chat_id=c.id) AS member_names, "
                "(SELECT COUNT(*) FROM members m WHERE m.chat_id=c.id) AS count_n, "
                "(SELECT COUNT(*) FROM messages g WHERE g.chat_id=c.id AND g.kind!='system') AS msgs_n, "
                "(SELECT MAX(created_at) FROM messages g WHERE g.chat_id=c.id) AS last_at "
                "FROM chats c LEFT JOIN users o ON o.id=c.owner_id ORDER BY c.id"):
            kind = ("کانال" if r["channel"] else "گروه") if r["kind"] == "group" else "خصوصی"
            title = r["title"] or "—"
            members = clip(r["member_names"], 60)
            disp = (r["id"], kind, title, members, r["owner_name"] or "—", r["count_n"], r["msgs_n"],
                    fmt_dt(r["last_at"]), fmt_dt(r["created_at"]))
            out.append(dict(iid=str(r["id"]), display=disp,
                            sort=(r["id"], kind, title.lower(), members, r["owner_name"] or "", r["count_n"],
                                  r["msgs_n"], r["last_at"] or 0, r["created_at"]),
                            export=(r["id"], r["kind"], r["title"] or "", r["member_names"] or "", r["owner_name"] or "",
                                    r["count_n"], r["msgs_n"], iso(r["last_at"]), iso(r["created_at"])),
                            tags=(),
                            detail=[("ID", r["id"]), ("نوع", kind), ("عنوان", title), ("اعضا", r["member_names"] or "—"),
                                    ("سازنده", r["owner_name"] or "—"), ("تعداد پیام", r["msgs_n"]),
                                    ("آخرین پیام", fmt_dt(r["last_at"])), ("ساخته‌شده", fmt_dt(r["created_at"]))]))
        return out

    def load_messages(self):
        out = []
        for r in self.db.execute(
                "SELECT m.*, u.username AS sender, c.kind AS chat_kind, c.title AS chat_title, "
                "(SELECT group_concat(u2.username, ' ↔ ') FROM members mm JOIN users u2 ON u2.id=mm.user_id "
                "  WHERE mm.chat_id=m.chat_id) AS chat_members "
                "FROM messages m LEFT JOIN users u ON u.id=m.sender_id JOIN chats c ON c.id=m.chat_id "
                "ORDER BY m.id DESC LIMIT 5000"):
            chat = r["chat_title"] if r["chat_kind"] == "group" else (r["chat_members"] or "—")
            kind = {"text": "متن", "file": "فایل", "system": "سیستمی"}[r["kind"]]
            if r["kind"] == "file" and '"voice"' in (r["meta"] or ""):
                kind = "ویس"
            state = "حذف‌شده" if r["deleted"] else ("ویرایش‌شده" if r["edited_at"] else "—")
            text = "(حذف شده)" if r["deleted"] else r["body"]
            fileinfo = f"{r['file_name']} ({r['file_size'] // 1024} KB)" if r["file_name"] and not r["deleted"] else ""
            sender = r["sender"] or ("سیستم" if r["kind"] == "system" else "(حذف‌شده)")
            disp = (r["id"], clip(chat, 30), sender, kind, clip(text, 90), fileinfo, fmt_dt(r["created_at"]), state)
            out.append(dict(iid=str(r["id"]), display=disp,
                            sort=(r["id"], chat.lower(), sender.lower(), kind, text.lower(), fileinfo,
                                  r["created_at"], state),
                            export=(r["id"], chat, sender, r["kind"], text, fileinfo, iso(r["created_at"]), state),
                            tags=("dim",) if r["deleted"] or r["kind"] == "system" else (),
                            detail=[("ID", r["id"]), ("چت", chat), ("فرستنده", sender), ("نوع", kind),
                                    ("زمان", fmt_dt(r["created_at"])), ("وضعیت", state),
                                    ("پاسخ به پیام", r["reply_to"] or "—"), ("فایل", fileinfo or "—"),
                                    ("متن کامل", text or "—")]))
        return out

    def load_files(self):
        out = []
        for r in self.db.execute(
                "SELECT m.id, m.file_name, m.file_path, m.file_size, m.created_at, u.username AS sender "
                "FROM messages m LEFT JOIN users u ON u.id=m.sender_id "
                "WHERE m.kind='file' AND m.deleted=0 ORDER BY m.id DESC"):
            rel = r["file_path"] or ""
            folder = os.path.dirname(rel).replace("\\", "/") or "(قدیمی)"
            ext = os.path.splitext(r["file_name"] or "")[1].lstrip(".").lower() or "—"
            exists = resolve_upload(rel) is not None
            state = "موجود" if exists else "گم‌شده"
            size = r["file_size"] or 0
            size_txt = f"{size / 1048576:.1f} MB" if size >= 1048576 else f"{max(1, size // 1024)} KB"
            sender = r["sender"] or "(حذف‌شده)"
            disp = (r["id"], folder, r["file_name"], ext, size_txt, sender, fmt_dt(r["created_at"]), state)
            out.append(dict(iid=str(r["id"]), display=disp,
                            sort=(r["id"], folder.lower(), (r["file_name"] or "").lower(), ext, size, sender.lower(),
                                  r["created_at"], state),
                            export=(r["id"], folder, r["file_name"], ext, size, sender, iso(r["created_at"]), state),
                            tags=() if exists else ("bad",),
                            detail=[("ID پیام", r["id"]), ("نام فایل", r["file_name"]), ("پوشه", folder),
                                    ("مسیر کامل", str(resolve_upload(rel) or "— (فایل روی دیسک نیست)")),
                                    ("حجم", f"{size:,} bytes"), ("فرستنده", sender),
                                    ("زمان آپلود", fmt_dt(r["created_at"])), ("روی دیسک", state)]))
        return out

    # ---- profile photos (data/avatars/<user>/..., completely separate from uploads/)
    @staticmethod
    def _avatars_root():
        common.AVATARS_DIR.mkdir(parents=True, exist_ok=True)
        return common.AVATARS_DIR

    def load_profiles(self):
        out = []
        entries = []
        for r in self.db.execute("SELECT id, username, display_name, avatar, avatar_at FROM users ORDER BY id"):
            entries.append(("u", r["id"], "کاربر", f"{r['display_name']} (@{r['username']})", r["avatar"], r["avatar_at"],
                            avatar_folder_for_user(r["username"])))
        for r in self.db.execute("SELECT id, title, avatar, avatar_at FROM chats WHERE kind='group' ORDER BY id"):
            entries.append(("c", r["id"], "گروه", r["title"] or "—", r["avatar"], r["avatar_at"],
                            avatar_folder_for_chat(r["id"], r["title"] or "")))
        for pre, id_, kind, name, rel, at, folder in entries:
            d = common.AVATARS_DIR / (os.path.dirname(rel) if rel else folder)
            files = [f for f in d.glob("*") if f.is_file() and not f.stem.endswith("_s")] if d.is_dir() else []   # thumbs/ is a sub-folder
            if not files and not rel:
                continue
            total = sum(f.stat().st_size for f in d.rglob("*") if f.is_file()) if d.is_dir() else 0
            cur = os.path.basename(rel) if rel else "— (برداشته شده)"
            exists = resolve_avatar(rel) is not None if rel else bool(files)
            last = max((f.stat().st_mtime for f in files), default=0)
            size_txt = f"{total / 1048576:.1f} MB" if total >= 1048576 else f"{max(1, total // 1024)} KB"
            rel_folder = str(d.relative_to(common.AVATARS_DIR)).replace("\\", "/")
            disp = (id_, kind, clip(name, 30), cur, len(files), size_txt, "avatars/" + rel_folder, fmt_dt(last),
                    "موجود" if exists else "گم‌شده")
            out.append(dict(iid=f"{pre}{id_}", display=disp,
                            sort=(id_, kind, name.lower(), cur, len(files), total, rel_folder, last, str(exists)),
                            export=(id_, kind, name, cur, len(files), total, rel_folder, iso(last), "موجود" if exists else "گم‌شده"),
                            tags=() if exists or not rel else ("bad",),
                            detail=[("نوع", kind), ("نام", name), ("عکس فعلی", cur), ("تعداد عکس‌های ذخیره‌شده", len(files)),
                                    ("پوشه", str(d)), ("آخرین تغییر", fmt_dt(last)),
                                    ("توضیح", "عکس‌های قبلی هیچ‌وقت پاک نمی‌شن؛ این پوشه جدا از پوشه فایل‌هاست.")],
                            _folder=d, _rel=rel, _pre=pre, _id=id_))
        return out

    # ---- watch/listen rooms: only recorded here (rooms_log), never shown anywhere else
    KIND_FA = {"private": "چت خصوصی", "group": "گروه", "free": "اتاق آزاد"}

    def load_rooms(self):
        out = []
        for i, r in enumerate(self.db.execute("SELECT * FROM rooms_log ORDER BY created_at, rowid"), 1):
            kind = self.KIND_FA.get(r["kind"], r["kind"])
            live = r["closed_at"] is None
            state = "فعال" if live else "بسته شد"
            now = len([x for x in (r["members"] or "").split(", ") if x]) if live else 0
            members = clip(r["members"] or "—", 60)
            disp = (i, r["title"] or "—", kind, r["owner_name"] or "—", now, r["peak"], members, clip(r["cur"] or "—", 40),
                    r["songs"], r["invites"], fmt_dt(r["created_at"]), state)
            out.append(dict(iid=r["id"], display=disp,
                            sort=(i, (r["title"] or "").lower(), kind, r["owner_name"] or "", now, r["peak"], members, r["cur"] or "",
                                  r["songs"], r["invites"], r["created_at"], state),
                            export=(i, r["title"], r["kind"], r["owner_name"], now, r["peak"], r["members"], r["cur"], r["songs"], r["invites"],
                                    iso(r["created_at"]), state),
                            tags=() if live else ("dim",),
                            detail=[("اتاق", r["title"]), ("نوع", kind), ("سازنده", r["owner_name"] or "—"), ("چت مرتبط", r["chat_id"] if r["chat_id"] else "— (اتاق آزاد)"),
                                    ("حاضرین", r["members"] or "—"), ("حداکثر هم‌زمان", r["peak"]), ("در حال پخش", r["cur"] or "—"),
                                    ("تعداد فایل/آهنگ اضافه‌شده", r["songs"]), ("تعداد دعوت", r["invites"]),
                                    ("شروع", fmt_dt(r["created_at"])), ("آخرین فعالیت", fmt_dt(r["last_at"])),
                                    ("پایان", fmt_dt(r["closed_at"]) if r["closed_at"] else "هنوز فعاله"),
                                    ("یادآوری", "محتوای چت و صدای اتاق روی سرور ذخیره نمی‌شه؛ فقط همین خلاصه ثبت می‌شه.")]))
        return out

    # ---- room songs (data/roomaudio/): the library every room can play from the server
    @staticmethod
    def _songs_root():
        common.ROOMAUDIO_DIR.mkdir(parents=True, exist_ok=True)
        return common.ROOMAUDIO_DIR

    def load_songs(self):
        out = []
        for i, x in enumerate(common.list_roomaudio(), 1):
            folder = x["folder"] or "— (سطح اصلی)"
            up = x["folder"].startswith(common.UPLOADS_FOLDER)
            why = "آپلود کاربر" if up else "کتابخانه مدیر"
            disp = (i, x["name"], folder, f"{x['size'] / 1048576:.1f} MB", fmt_dt(x["mtime"]), why)
            out.append(dict(iid=x["rel"], display=disp, sort=(i, x["name"].lower(), folder.lower(), x["size"], x["mtime"], why),
                            export=(i, x["name"], folder, x["size"], iso(x["mtime"]), why), tags=("dim",) if up else (),
                            detail=[("آهنگ", x["name"]), ("مسیر", str(self._songs_root() / x["rel"])), ("منبع", why),
                                    ("راهنما", "هر زیرپوشه داخل roomaudio یک پلی‌لیسته؛ همه تو تب «آهنگ‌ها»ی اتاق می‌بینن.")]))
        return out

    def act_add_songs(self):
        paths = filedialog.askopenfilenames(parent=self, title="آهنگ‌ها", filetypes=[("Audio", "*.mp3 *.m4a *.aac *.ogg *.opus *.wav *.flac *.weba")])
        if not paths:
            return
        from tkinter import simpledialog
        pl = (simpledialog.askstring("پلی‌لیست", "اسم پلی‌لیست (پوشه)؛ خالی = سطح اصلی:", parent=self) or "").strip()
        pl = "".join(ch for ch in pl if ch not in '\\/:*?"<>|.')[:60]
        dest_dir = self._songs_root() / pl if pl else self._songs_root()
        dest_dir.mkdir(parents=True, exist_ok=True)
        n = 0
        for src in paths:
            name = os.path.basename(src)
            if not name.lower().endswith(common.AUDIO_EXTS) or os.path.getsize(src) > common.SONG_MAX:
                self.toast(f"«{name}» قبول نشد (صوتی تا ۸۰ مگابایت)", error=True)
                continue
            dest = dest_dir / name
            k = 1
            while dest.exists():
                dest = dest_dir / f"{os.path.splitext(name)[0]}_{k}{os.path.splitext(name)[1]}"
                k += 1
            shutil.copyfile(src, dest)
            n += 1
        if n:
            self.toast(f"{fa(n)} آهنگ اضافه شد")
            self.last_signature = None
            self.refresh()

    def act_open_song_folder(self):
        sel = self.tree.selection()
        if not sel:
            return self.toast("اول یه ردیف رو انتخاب کن", error=True)
        self.open_path((self._songs_root() / sel[0]).parent)

    # ---- chat wallpapers (data/wallpapers/): every user can pick these as chat background
    @staticmethod
    def _walls_root():
        common.WALLPAPERS_DIR.mkdir(parents=True, exist_ok=True)
        return common.WALLPAPERS_DIR

    def load_walls(self):
        out = []
        root = self._walls_root()
        good = {n for n, _, _ in common.list_wallpapers()}
        files = sorted((p for p in root.iterdir() if p.is_file() and not p.name.startswith(".")), key=lambda p: p.name.lower())
        for i, p in enumerate(files, 1):
            st = p.stat()
            dim = "—"
            try:
                from PIL import Image
                with Image.open(p) as im:
                    dim = f"{im.width}×{im.height}"
            except Exception:
                pass
            ok = p.name in good
            why = "فعال: کاربرها می‌بینن" if ok else ("نامعتبر (فقط jpg/png/webp و حداکثر ۱۲ مگابایت)")
            size_txt = f"{st.st_size / 1048576:.1f} MB" if st.st_size >= 1048576 else f"{max(1, st.st_size // 1024)} KB"
            disp = (i, p.name, dim, size_txt, fmt_dt(st.st_mtime), why)
            out.append(dict(iid=p.name, display=disp, sort=(i, p.name.lower(), dim, st.st_size, st.st_mtime, why),
                            export=(i, p.name, dim, st.st_size, iso(st.st_mtime), why), tags=() if ok else ("bad",),
                            detail=[("نام فایل", p.name), ("ابعاد", dim), ("مسیر", str(p)), ("وضعیت", why),
                                    ("راهنما", "هر عکسی که اینجا بذاری، خودکار تو «تنظیمات › پس‌زمینه چت» همه کاربرها میاد.")]))
        return out

    # ---- every user's OWN chat background (data/userwalls/<user>/<time>.img): shown to nobody but that user
    @staticmethod
    def _userwalls_root():
        d = common.DATA_DIR / "userwalls"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def load_userwalls(self):
        out = []
        root = self._userwalls_root()
        folders = sorted((p for p in root.iterdir() if p.is_dir()), key=lambda p: p.name.lower())
        for i, d in enumerate(folders, 1):
            imgs = sorted((f for f in d.iterdir() if f.suffix == ".img" and f.stem.isdigit()), key=lambda f: int(f.stem))
            removed = d / "_removed"
            n_removed = len([f for f in removed.iterdir()]) if removed.is_dir() else 0
            cur = imgs[-1] if imgs else None
            dim, last = "—", 0
            if cur:
                last = int(cur.stem) / 1000
                try:
                    from PIL import Image
                    with Image.open(cur) as im:
                        dim = f"{im.width}×{im.height}"
                except Exception:
                    pass
            total = sum(f.stat().st_size for f in imgs)
            size_txt = f"{total / 1048576:.1f} MB" if total >= 1048576 else f"{max(1, total // 1024) if total else 0} KB"
            state = "در حال استفاده" if cur else "برداشته شده"
            disp = (i, d.name, len(imgs), dim, size_txt, str(d), fmt_dt(last) if last else "—", state)
            out.append(dict(iid=d.name, display=disp, sort=(i, d.name.lower(), len(imgs), dim, total, str(d), last, state),
                            export=(i, d.name, len(imgs), dim, total, str(d), iso(last) if last else "", state),
                            tags=() if cur else ("bad",),
                            detail=[("کاربر", d.name), ("تعداد عکس‌ها (قدیمی‌ها هم می‌مونن)", str(len(imgs))), ("عکس فعلی", str(cur or "—")),
                                    ("برداشته‌شده‌ها", str(n_removed)), ("پوشه", str(d)),
                                    ("راهنما", "این عکس فقط برای خود همین کاربر دیده می‌شه (پس‌زمینه چتش).")]))
        return out

    def _userwall_dir(self):
        sel = self.tree.selection()
        if not sel:
            self.toast("اول یه ردیف رو انتخاب کن", error=True)
            return None
        d = (self._userwalls_root() / sel[0]).resolve()
        return d if d.parent == self._userwalls_root().resolve() and d.is_dir() else None

    def act_open_userwall(self):
        d = self._userwall_dir()
        if not d:
            return
        imgs = sorted((f for f in d.iterdir() if f.suffix == ".img" and f.stem.isdigit()), key=lambda f: int(f.stem))
        if not imgs:
            return self.toast("این کاربر الان پس‌زمینه شخصی نداره", error=True)
        # the stored file has no picture extension on purpose; open a temporary copy the system can recognise
        import tempfile
        tmp = os.path.join(tempfile.gettempdir(), f"wd_userwall_{d.name}.jpg")
        shutil.copyfile(imgs[-1], tmp)
        self.open_path(tmp)

    def act_open_userwall_folder(self):
        d = self._userwall_dir()
        if d:
            self.open_path(d)

    def act_clear_userwall(self):
        d = self._userwall_dir()
        if not d:
            return
        imgs = [f for f in d.iterdir() if f.suffix == ".img"]
        if not imgs:
            return self.toast("چیزی برای برداشتن نیست", error=True)
        if not self.confirm(f"همه پس‌زمینه‌های شخصی «{d.name}» برای همیشه پاک بشن؟"):
            return
        common.retire_user_wall(d.name)
        self.toast("پاک شد")
        self.last_signature = None
        self.refresh()

    def act_add_walls(self):
        paths = filedialog.askopenfilenames(parent=self, title="عکس‌های پس‌زمینه", filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        n = 0
        for src in paths:
            name = os.path.basename(src)
            if not common.valid_wall_name(name) or os.path.getsize(src) > common.WALL_MAX:
                self.toast(f"«{name}» قبول نشد (jpg/png/webp، تا ۱۲ مگابایت)", error=True)
                continue
            dest = self._walls_root() / name
            k = 1
            while dest.exists():
                dest = self._walls_root() / f"{os.path.splitext(name)[0]}_{k}{os.path.splitext(name)[1]}"
                k += 1
            shutil.copyfile(src, dest)
            n += 1
        if n:
            self.toast(f"{fa(n)} عکس اضافه شد")
            self.last_signature = None
            self.refresh()

    def act_open_wall(self):
        sel = self.tree.selection()
        if not sel:
            return self.toast("اول یه ردیف رو انتخاب کن", error=True)
        self.open_path(self._walls_root() / sel[0])

    def _profile_row(self):
        sel = self.tree.selection()
        if not sel:
            self.toast("اول یه ردیف رو انتخاب کن", error=True)
            return None
        return next((r for r in self.rows if r["iid"] == sel[0]), None)

    def act_open_avatar(self):
        r = self._profile_row()
        if r:
            p = resolve_avatar(r["_rel"])
            self.open_path(p) if p else self.toast("عکسی تنظیم نشده", error=True)

    def act_open_avatar_folder(self):
        r = self._profile_row()
        if r:
            self.open_path(r["_folder"]) if r["_folder"].is_dir() else self.toast("پوشه‌ای نیست", error=True)

    def act_clear_avatar(self):
        r = self._profile_row()
        if not r or not r["_rel"]:
            return
        if not self.confirm("عکس از پروفایل برداشته بشه؟\n(فایل‌ها روی دیسک می‌مونن و پاک نمی‌شن)"):
            return
        table = "users" if r["_pre"] == "u" else "chats"
        with self.db:
            self.db.execute(f"UPDATE {table} SET avatar=NULL, avatar_at=0 WHERE id=?", (r["_id"],))
        self.toast("عکس از پروفایل برداشته شد (فایل‌ها محفوظ‌اند)")
        self.last_signature = None
        self.refresh()

    # ------------------------------------------------------------- render
    def visible_rows(self):
        q = self.search_var.get().strip().casefold()
        rows = self.rows
        if q:
            rows = [r for r in rows if any(q in str(v).casefold() for v in r["display"])]
        key, rev = self.sort[self.tab]
        idx = [c[0] for c in COLUMNS[self.tab]].index(key)
        return sorted(rows, key=lambda r: r["sort"][idx], reverse=rev)

    def render(self):
        keep = set(self.tree.selection())
        yview = self.tree.yview()
        self.tree.delete(*self.tree.get_children())
        shown = self.visible_rows()
        for i, r in enumerate(shown):
            tags = list(r["tags"]) + (["odd"] if i % 2 else [])
            self.tree.insert("", "end", iid=r["iid"], values=r["display"], tags=tags)
        sel = [i for i in keep if self.tree.exists(i)]
        if sel:
            self.tree.selection_set(sel)
        self.tree.yview_moveto(yview[0])
        key, rev = self.sort[self.tab]
        for k, title, *_ in COLUMNS[self.tab]:
            self.tree.heading(k, text=title + (("  ▼" if rev else "  ▲") if k == key else ""))
        self.update_status()

    def update_status(self):
        total, shown = len(self.rows), len(self.tree.get_children())
        sel = len(self.tree.selection())
        txt = f"{fa(shown)} ردیف" + (f" از {fa(total)}" if shown != total else "")
        if sel:
            txt += f"   ·   {fa(sel)} انتخاب‌شده"
        self.status.configure(text=txt + f"   ·   بروزرسانی: {fa(time.strftime('%H:%M:%S'))}", fg=T["muted"])

    def _auto(self):
        if self.auto_var.get():
            try:
                self.refresh()
            except Exception as e:      # db busy etc. - try again next tick
                self.status.configure(text=f"خطا در خوندن دیتابیس: {e}", fg=T["danger"])
        self.after(2500, self._auto)

    # ------------------------------------------------------------ actions
    def selected_ids(self):
        return [int(i) for i in self.tree.selection()]

    def need_selection(self):
        ids = self.selected_ids()
        if not ids:
            self.toast("اول یه ردیف رو انتخاب کن", error=True)
        return ids

    def confirm(self, text):
        return messagebox.askyesno("تأیید", text, parent=self)

    def context_menu(self, event):
        row = self.tree.identify_row(event.y)
        if not row:
            return
        if row not in self.tree.selection():
            self.tree.selection_set(row)
        m = tk.Menu(self, tearoff=0, bg=T["side"], fg=T["text"], activebackground=T["sel"],
                    activeforeground=T["sel_text"], bd=0, font=font(10))
        m.add_command(label="جزئیات", command=self.show_detail)
        if self.tab == "walls":
            m.add_command(label="باز کردن عکس", command=self.act_open_wall)
        if self.tab == "profiles":
            m.add_command(label="باز کردن عکس", command=self.act_open_avatar)
            m.add_command(label="باز کردن پوشه", command=self.act_open_avatar_folder)
        if self.tab == "users":
            m.add_command(label="مسدود / رفع مسدودی", command=self.act_ban)
            m.add_command(label="رفع قفل", command=self.act_unlock)
            m.add_command(label="ریست رمز", command=self.act_reset_pw)
        if self.tab == "userwalls":
            m.add_command(label="باز کردن عکس فعلی", command=self.act_open_userwall)
            m.add_command(label="پوشه این کاربر", command=self.act_open_userwall_folder)
            m.add_command(label="برداشتن پس‌زمینه", command=self.act_clear_userwall)
        if self.tab not in ("profiles", "userwalls"):
            m.add_separator()
            m.add_command(label="حذف", command=self.act_delete)
        m.tk_popup(event.x_root, event.y_root)
        m.grab_release()

    def _remove_files(self, where, args=()):
        rows = self.db.execute(f"SELECT id, file_path FROM messages WHERE file_path IS NOT NULL AND ({where})", args).fetchall()
        ids = {r["id"] for r in rows}
        for path in {r["file_path"] for r in rows}:
            users = {x["id"] for x in self.db.execute("SELECT id FROM messages WHERE file_path=?", (path,))}
            if users <= ids:                 # a file shared with a forward that stays is kept
                remove_upload(path)

    # --- file tab actions
    def open_path(self, path):
        path = str(path)
        try:
            if sys.platform.startswith("win"):
                os.startfile(path)                       # noqa: Windows only
            elif sys.platform == "darwin":
                subprocess.Popen(["open", path])
            else:
                subprocess.Popen(["xdg-open", path])
        except Exception as e:
            self.toast(f"باز نشد: {e}", error=True)

    def _selected_file_path(self):
        ids = self.need_selection()
        if not ids:
            return None
        row = self.db.execute("SELECT file_path, file_name FROM messages WHERE id=?", (ids[0],)).fetchone()
        p = resolve_upload(row["file_path"]) if row else None
        if p is None:
            self.toast("این فایل روی دیسک نیست", error=True)
        return (p, row["file_name"]) if p else None

    def act_open_file(self):
        sel = self._selected_file_path()
        if sel:
            self.open_path(sel[0])

    def act_open_folder(self):
        sel = self._selected_file_path()
        if not sel:
            return
        if sys.platform.startswith("win"):
            subprocess.Popen(["explorer", "/select,", str(sel[0])])      # opens Explorer with the file highlighted
        else:
            self.open_path(sel[0].parent)

    def act_save_copy(self):
        sel = self._selected_file_path()
        if sel:
            dest = filedialog.asksaveasfilename(parent=self, initialfile=sel[1])
            if dest:
                shutil.copyfile(sel[0], dest)
                self.toast("کپی ذخیره شد")

    def act_ban(self):
        ids = self.need_selection()
        if not ids:
            return
        marks = ",".join("?" * len(ids))
        any_active = self.db.execute(f"SELECT COUNT(*) FROM users WHERE id IN ({marks}) AND banned=0", ids).fetchone()[0]
        with self.db:
            self.db.execute(f"UPDATE users SET banned=? WHERE id IN ({marks})", [1 if any_active else 0] + ids)
        self.toast(("مسدود شد" if any_active else "مسدودی برداشته شد") + " (کاربر آنلاین بلافاصله قطع می‌شه)")
        self.last_signature = None
        self.refresh()

    def act_unlock(self):
        ids = self.need_selection()
        if ids:
            marks = ",".join("?" * len(ids))
            with self.db:
                self.db.execute(f"UPDATE users SET failed_logins=0, locked_until=0 WHERE id IN ({marks})", ids)
            self.toast("قفل برداشته شد")
            self.last_signature = None
            self.refresh()

    def act_reset_pw(self):
        ids = self.need_selection()
        if not ids:
            return
        uid = ids[0]
        name = self.db.execute("SELECT username FROM users WHERE id=?", (uid,)).fetchone()["username"]
        if not self.confirm(f"رمز «{name}» ریست بشه و یه رمز موقت ساخته بشه؟"):
            return
        alphabet = string.ascii_letters + string.digits
        temp = "".join(secrets.choice(alphabet) for _ in range(10)) + secrets.choice("!@#$%") + secrets.choice(string.digits)
        salt, digest = hash_secret(temp)
        with self.db:
            self.db.execute("UPDATE users SET pw_salt=?, pw_hash=?, failed_logins=0, locked_until=0 WHERE id=?",
                            (salt, digest, uid))
            self.db.execute("DELETE FROM sessions WHERE user_id=?", (uid,))     # sign the user out everywhere
        d = Dialog(self, "رمز موقت", 380)
        tk.Label(d.body, text=f"رمز موقت «{name}»", bg=T["side"], fg=T["muted"], font=font(10)).pack(anchor="w")
        e = make_entry(d.body)
        e.insert(0, temp)
        e.configure(state="readonly", readonlybackground=T["entry"], fg=T["accent"], font=font(14, "bold"))
        e.pack(fill="x", ipady=8, pady=8)
        tk.Label(d.body, text="این رمز فقط همین یه بار نشون داده می‌شه. به کاربر بده تا از پروفایل عوضش کنه.",
                 bg=T["side"], fg=T["muted"], font=font(9), wraplength=330, justify="left").pack(anchor="w")

        def copy():
            self.clipboard_clear()
            self.clipboard_append(temp)
        FlatButton(d.body, "کپی رمز", copy).pack(fill="x", pady=(12, 0))

    def act_delete(self):
        if self.tab == "songs":
            sel = self.tree.selection()
            if not sel:
                return self.toast("اول یه ردیف رو انتخاب کن", error=True)
            if not self.confirm(f"{fa(len(sel))} آهنگ از کتابخانه پاک بشه؟ این کار برگشت نداره."):
                return
            for rel in sel:
                p = common.resolve_roomaudio(rel)
                if p:
                    try:
                        p.unlink()
                    except OSError:
                        pass
            self.toast(f"{fa(len(sel))} آهنگ حذف شد")
            self.last_signature = None
            return self.refresh()
        if self.tab == "walls":
            sel = self.tree.selection()
            if not sel:
                return self.toast("اول یه ردیف رو انتخاب کن", error=True)
            if not self.confirm(f"{fa(len(sel))} عکس پس‌زمینه از پوشه پاک بشه؟ این کار برگشت نداره."):
                return
            for name in sel:
                p = self._walls_root() / name
                if p.resolve().parent == self._walls_root().resolve():
                    try:
                        p.unlink()
                        (self._walls_root() / "_thumbs" / (name + ".jpg")).unlink(missing_ok=True)
                    except OSError:
                        pass
            self.toast(f"{fa(len(sel))} عکس حذف شد")
            self.last_signature = None
            return self.refresh()
        if self.tab == "userwalls":
            return self.act_clear_userwall()
        if self.tab == "profiles":
            return self.toast("عکس‌های پروفایل پاک نمی‌شن؛ فقط می‌تونی از پروفایل برداشته‌شون", error=True)
        ids = self.need_selection()
        if not ids:
            return
        noun = {"users": "کاربر", "chats": "چت", "messages": "پیام", "files": "فایل"}[self.tab]
        extra = {"users": "\n(چت‌های خصوصی‌اش هم پاک می‌شه)", "chats": "\n(همه پیام‌ها و فایل‌هاش پاک می‌شه)",
                 "messages": "", "files": "\n(پیام مربوط هم به‌صورت «حذف‌شده» می‌مونه)"}[self.tab]
        if not self.confirm(f"{fa(len(ids))} {noun} حذف بشه؟ این کار برگشت نداره.{extra}"):
            return
        marks = ",".join("?" * len(ids))
        with self.db:
            if self.tab in ("messages", "files"):
                self._remove_files(f"id IN ({marks})", ids)
                self.db.execute(f"UPDATE messages SET deleted=1, body='', file_path=NULL WHERE id IN ({marks})", ids)
            elif self.tab == "chats":
                self._remove_files(f"chat_id IN ({marks})", ids)
                self.db.execute(f"DELETE FROM chats WHERE id IN ({marks})", ids)
            else:
                for uid in ids:
                    self._delete_user(uid)
        self.toast(f"{fa(len(ids))} {noun} حذف شد")
        self.last_signature = None
        self.refresh()

    def _delete_user(self, uid):
        db = self.db
        for c in db.execute("SELECT c.id FROM chats c JOIN members m ON m.chat_id=c.id "
                            "WHERE m.user_id=? AND c.kind='private'", (uid,)).fetchall():
            self._remove_files("chat_id=?", (c["id"],))
            db.execute("DELETE FROM chats WHERE id=?", (c["id"],))
        for g in db.execute("SELECT id FROM chats WHERE kind='group' AND owner_id=?", (uid,)).fetchall():
            db.execute("DELETE FROM members WHERE chat_id=? AND user_id=?", (g["id"], uid))
            nxt = db.execute("SELECT user_id FROM members WHERE chat_id=? ORDER BY joined_at LIMIT 1",
                             (g["id"],)).fetchone()
            if nxt:
                db.execute("UPDATE chats SET owner_id=? WHERE id=?", (nxt["user_id"], g["id"]))
                db.execute("UPDATE members SET role='owner' WHERE chat_id=? AND user_id=?", (g["id"], nxt["user_id"]))
            else:
                self._remove_files("chat_id=?", (g["id"],))
                db.execute("DELETE FROM chats WHERE id=?", (g["id"],))
        db.execute("DELETE FROM users WHERE id=?", (uid,))

    def show_detail(self):
        sel = self.tree.selection()
        if not sel:
            return self.toast("اول یه ردیف رو انتخاب کن", error=True)
        row = next((r for r in self.rows if r["iid"] == sel[0]), None)
        if not row:
            return
        d = Dialog(self, "جزئیات", 520)
        for key, val in row["detail"]:
            line = tk.Frame(d.body, bg=T["side"])
            line.pack(fill="x", pady=3)
            tk.Label(line, text=key, bg=T["side"], fg=T["muted"], font=font(9), width=18, anchor="w",
                     justify="left").pack(side="left", anchor="n")
            tk.Label(line, text=str(val), bg=T["side"], fg=T["text"], font=font(10), wraplength=340, anchor="w",
                     justify="left").pack(side="left", fill="x", expand=True)

    def export_csv(self):
        path = filedialog.asksaveasfilename(parent=self, defaultextension=".csv", initialfile=f"windroida_{self.tab}.csv",
                                            filetypes=[("CSV", "*.csv")])
        if not path:
            return
        shown = {r["iid"]: r for r in self.visible_rows()}
        order = [i for i in self.tree.get_children() if i in shown]
        with open(path, "w", newline="", encoding="utf-8-sig") as fh:
            w = csv.writer(fh)
            w.writerow([c[1] for c in COLUMNS[self.tab]])
            for iid in order:
                w.writerow(shown[iid]["export"])
        self.toast(f"{fa(len(order))} ردیف ذخیره شد")



# ---- password gate: the datasheet shows every user's data, so it asks for a password first.
# Only a salted PBKDF2 hash is stored here, never the password itself.
_PW_SALT = bytes.fromhex("68f419c32d4971a2f0375681fb83cb1f")
_PW_HASH = bytes.fromhex("db4cea34f3359fe421cdf503a5ee38cc071c2a3ddc835f02e698dd1e2bb5791e")


def _password_ok(pw):
    import hashlib
    import hmac
    return hmac.compare_digest(hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), _PW_SALT, 200000), _PW_HASH)


def ask_password():
    """True when the right password was typed (5 tries)."""
    root = tk.Tk()
    init_fonts(root)
    set_theme(load_config().get("theme", "dark"))
    root.title("Windroida Datasheet")
    root.configure(bg=T["bg"])
    root.resizable(False, False)
    w, h = 340, 190
    root.geometry(f"{w}x{h}+{(root.winfo_screenwidth() - w) // 2}+{(root.winfo_screenheight() - h) // 3}")
    tk.Label(root, text="رمز دیتاشیت", bg=T["bg"], fg=T["text"], font=font(14, "bold")).pack(pady=(18, 8))
    var = tk.StringVar()
    ent = tk.Entry(root, textvariable=var, show="•", justify="center", font=font(13), width=22, bg=T["entry"], fg=T["text"], insertbackground=T["text"], relief="flat")
    ent.pack(pady=4)
    msg = tk.Label(root, text="", bg=T["bg"], fg=T["danger"], font=font(10))
    msg.pack(pady=4)
    state = {"ok": False, "tries": 0}

    def go(_e=None):
        if _password_ok(var.get()):
            state["ok"] = True
            root.destroy()
            return
        state["tries"] += 1
        var.set("")
        if state["tries"] >= 5:
            root.destroy()
            return
        msg.config(text="رمز اشتباهه")
        ent.config(state="disabled")
        root.after(1200, lambda: (ent.config(state="normal"), ent.focus_set()))

    ent.bind("<Return>", go)
    tk.Button(root, text="ورود", command=go, width=14).pack(pady=4)
    ent.focus_set()
    root.mainloop()
    return state["ok"]


def main():
    if not ask_password():
        return
    Datasheet().mainloop()


if __name__ == "__main__":
    main()
