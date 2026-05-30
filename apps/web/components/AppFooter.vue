<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-cols">
        <div class="footer-about">
          <div class="brand">
            <div class="brand-mark">D</div>
            <span class="brand-name">DRAGON</span>
          </div>
          <p class="brand-desc">
            اکوسیستم رسمی محتوای گیمینگ ایران. اخبار، مقالات، راهنما و بیشتر.
          </p>
        </div>

        <div class="footer-col">
          <div class="col-title">محتوا</div>
          <ul class="col-links">
            <li><NuxtLink to="/news" class="col-link">اخبار</NuxtLink></li>
            <li><NuxtLink to="/articles" class="col-link">مقالات</NuxtLink></li>
            <li><NuxtLink to="/guides" class="col-link">راهنما</NuxtLink></li>
            <li><NuxtLink to="/rules" class="col-link">قوانین</NuxtLink></li>
          </ul>
        </div>

        <div class="footer-col">
          <div class="col-title">کشف کن</div>
          <ul class="col-links">
            <li><NuxtLink to="/categories" class="col-link">دسته‌بندی‌ها</NuxtLink></li>
            <li><NuxtLink to="/tags" class="col-link">تگ‌ها</NuxtLink></li>
            <li><NuxtLink to="/search" class="col-link">جستجو</NuxtLink></li>
          </ul>
        </div>

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
          <NuxtLink to="/pages/terms" class="legal-link">شرایط استفاده</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: linear-gradient(180deg, transparent, rgba(11, 5, 25, 0.6));
  border-top: 1px solid var(--glass-hairline);
  padding-top: 64px;
  padding-bottom: 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.footer-inner {
  max-width: var(--layout-container-max);
  margin: 0 auto;
  padding: 0 24px;
}

.footer-cols {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

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
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #fff;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
  max-width: 260px;
}

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
  transition: color 120ms var(--ease-out);
}
.col-link:hover {
  color: var(--text-primary);
}

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
  gap: 18px;
}

.legal-link {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 120ms;
}
.legal-link:hover {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .footer-cols {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
