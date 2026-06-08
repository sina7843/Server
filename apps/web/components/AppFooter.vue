<template>
  <footer class="site-footer">
    <div class="footer-glow" aria-hidden="true" />
    <div class="footer-inner">
      <div class="footer-cols">
        <!-- Brand -->
        <div class="footer-about">
          <div class="brand">
            <div class="brand-mark">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
              </svg>
            </div>
            <span class="brand-name">DRAGON</span>
          </div>
          <p class="brand-desc">
            اکوسیستم رسمی محتوای گیمینگ ایران. اخبار، مقالات، راهنما و بیشتر.
          </p>
          <div class="brand-tagline">
            <span class="tagline-line" />
          </div>
        </div>

        <!-- Tournaments -->
        <div class="footer-col">
          <div class="col-title">رقابت‌ها</div>
          <ul class="col-links">
            <li><NuxtLink to="/tournaments" class="col-link">تورنمنت‌ها</NuxtLink></li>
          </ul>
        </div>

        <!-- Content links -->
        <div class="footer-col">
          <div class="col-title">محتوا</div>
          <ul class="col-links">
            <li><NuxtLink to="/news" class="col-link">اخبار</NuxtLink></li>
            <li><NuxtLink to="/articles" class="col-link">مقالات</NuxtLink></li>
            <li><NuxtLink to="/announcements" class="col-link">اطلاعیه‌ها</NuxtLink></li>
            <li><NuxtLink to="/guides" class="col-link">راهنما</NuxtLink></li>
            <li><NuxtLink to="/rules" class="col-link">قوانین</NuxtLink></li>
          </ul>
        </div>

        <!-- Discover links -->
        <div class="footer-col">
          <div class="col-title">کشف کن</div>
          <ul class="col-links">
            <li><NuxtLink to="/categories" class="col-link">دسته‌بندی‌ها</NuxtLink></li>
            <li><NuxtLink to="/search" class="col-link">جستجو</NuxtLink></li>
          </ul>
        </div>

        <!-- Account links -->
        <div class="footer-col">
          <div class="col-title">حساب کاربری</div>
          <ul class="col-links">
            <li><NuxtLink to="/account" class="col-link">پروفایل</NuxtLink></li>
            <li><NuxtLink to="/account/security" class="col-link">امنیت</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="copyright">© ۱۴۰۴ Dragon Ecosystem — تمام حقوق محفوظ است.</span>
        <div class="legal-links">
          <NuxtLink to="/pages/privacy" class="legal-link">حریم خصوصی</NuxtLink>
          <span class="legal-sep" aria-hidden="true">·</span>
          <NuxtLink to="/pages/terms" class="legal-link">شرایط استفاده</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  border-top: 1px solid var(--glass-hairline);
  padding-top: 64px;
  padding-bottom: 32px;
  overflow: hidden;
}

/* Ambient glow behind footer */
.footer-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--purple-500),
    transparent
  );
  opacity: 0.45;
}

.footer-inner {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
}

.footer-cols {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1fr 1fr 1fr;
  gap: 32px;
  margin-bottom: 48px;
}

/* ── Brand ── */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow:
    var(--glow-primary),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.brand-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 16px;
  max-width: 260px;
}

.brand-tagline {
  display: flex;
  align-items: center;
}

.tagline-line {
  display: block;
  width: 32px;
  height: 2px;
  border-radius: 999px;
  background: var(--brand-gradient);
  opacity: 0.6;
}

/* ── Columns ── */
.col-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  margin-bottom: 14px;
}

.col-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.col-link {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--ease-out);
}

.col-link:hover {
  color: var(--purple-300);
}

/* ── Bottom bar ── */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--glass-border);
}

.copyright {
  font-size: 12px;
  color: var(--text-muted);
}

.legal-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legal-link {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--motion-fast);
}

.legal-link:hover {
  color: var(--text-secondary);
}

.legal-sep {
  color: var(--text-disabled);
  font-size: 12px;
}

/* ── Mobile ── */
@media (max-width: 900px) {
  .footer-cols {
    grid-template-columns: 1.5fr 1fr 1fr;
    gap: 28px;
  }

  .footer-about {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .footer-cols {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .footer-about {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .footer-cols {
    grid-template-columns: 1fr;
  }
}
</style>
