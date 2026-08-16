insert into public.categories (slug, name, sort_order)
values
  ('cafe', '카페', 10),
  ('restaurant', '맛집', 20),
  ('beauty', '뷰티', 30),
  ('retail', '소매', 40),
  ('fitness', '운동', 50),
  ('culture', '문화', 60)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into public.pricing_packages (target_votes, price_credits)
values
  (30, 5000),
  (50, 7000),
  (70, 8000),
  (100, 10000)
on conflict (target_votes) do update
set price_credits = excluded.price_credits;

insert into public.legal_documents (document_key, version, title, is_required, effective_at)
values
  ('terms-of-service', '1.0', '서비스 이용약관', true, now()),
  ('privacy-policy', '1.0', '개인정보 수집 및 이용', true, now()),
  ('age-confirmation', '1.0', '만 14세 이상 확인', true, now()),
  ('test-policy', '1.0', '테스트 등록 및 결과 제공 정책', true, now())
on conflict (document_key, version) do nothing;

