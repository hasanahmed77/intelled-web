insert into public.static_question_sets (
  education_type,
  subject,
  topic,
  difficulty,
  language,
  variant_index,
  questions,
  active
)
values
  (
    'O Level',
    'Mathematics',
    'Number Skills',
    'easy',
    'english',
    1,
    '[
      {"prompt":"Evaluate \\(5 + 4 \\times 3\\).","feedback":"","correctAnswer":"17"},
      {"prompt":"Write \\(0.25\\) as a fraction in its simplest form.","feedback":"Convert decimal to fraction and simplify.","correctAnswer":"\\(1/4\\)"},
      {"prompt":"Find the HCF of 18 and 24.","feedback":"List factors or use prime factorisation.","correctAnswer":"6"},
      {"prompt":"Simplify \\(2^3 \\times 2^2\\).","feedback":"Add powers when multiplying.","correctAnswer":"\\(2^5\\)"},
      {"prompt":"Simplify \\(\\sqrt{16}\\).","feedback":"Find the number whose square is 16.","correctAnswer":"4"},
      {"prompt":"State whether 7 is a prime number.","feedback":"Prime numbers have exactly two factors.","correctAnswer":"Yes"},
      {"prompt":"A distance of 120 km is travelled in 2 hours. Find the speed.","feedback":"Speed = distance ÷ time.","correctAnswer":"60"},
      {"prompt":"Write \\(3/5\\) as a decimal.","feedback":"Divide numerator by denominator.","correctAnswer":"0.6"},
      {"prompt":"Round 4.567 to 2 decimal places.","feedback":"Look at the third decimal place to round.","correctAnswer":"4.57"},
      {"prompt":"Write \\(0.003\\) in standard form.","feedback":"Move decimal to make number between 1 and 10.","correctAnswer":"\\(3 \\times 10^{-3}\\)"}
    ]'::jsonb,
    true
  ),
  (
    'O Level',
    'Mathematics',
    'Number Skills',
    'easy',
    'english',
    2,
    '[
      {"prompt":"Evaluate \\(10 - 2 \\times 4\\).","feedback":"Follow order of operations (BODMAS).","correctAnswer":"2"},
      {"prompt":"Write \\(0.5\\) as a fraction.","feedback":"Convert decimal to fraction.","correctAnswer":"\\(1/2\\)"},
      {"prompt":"Find the LCM of 4 and 6.","feedback":"List multiples and find the smallest common one.","correctAnswer":"12"},
      {"prompt":"Simplify \\(3^2 \\times 3^3\\).","feedback":"Add indices when multiplying same base.","correctAnswer":"\\(3^5\\)"},
      {"prompt":"Simplify \\(\\sqrt{25}\\).","feedback":"Find square root.","correctAnswer":"5"},
      {"prompt":"Is 9 a prime number?","feedback":"Check number of factors.","correctAnswer":"No"},
      {"prompt":"Convert 2 hours to minutes.","feedback":"1 hour = 60 minutes.","correctAnswer":"120"},
      {"prompt":"Write 25% as a decimal.","feedback":"Divide by 100.","correctAnswer":"0.25"},
      {"prompt":"Round 7.843 to 1 decimal place.","feedback":"Look at second decimal place.","correctAnswer":"7.8"},
      {"prompt":"Write \\(0.0008\\) in standard form.","feedback":"Shift decimal to make number between 1 and 10.","correctAnswer":"\\(8 \\times 10^{-4}\\)"}
    ]'::jsonb,
    true
  ),
  (
    'O Level',
    'Mathematics',
    'Number Skills',
    'easy',
    'english',
    3,
    '[
      {"prompt":"Evaluate \\(12 \\div 3 + 5\\).","feedback":"Division before addition.","correctAnswer":"9"},
      {"prompt":"Write \\(0.2\\) as a fraction.","feedback":"Simplify fraction.","correctAnswer":"\\(1/5\\)"},
      {"prompt":"Find HCF of 20 and 30.","feedback":"List factors.","correctAnswer":"10"},
      {"prompt":"Simplify \\(5^2\\).","feedback":"Square means multiply by itself.","correctAnswer":"25"},
      {"prompt":"Simplify \\(\\sqrt{36}\\).","feedback":"Square root of 36.","correctAnswer":"6"},
      {"prompt":"State if 11 is prime.","feedback":"Check factors.","correctAnswer":"Yes"},
      {"prompt":"Convert 500 g to kg.","feedback":"1000 g = 1 kg.","correctAnswer":"0.5"},
      {"prompt":"Write 0.75 as percentage.","feedback":"Multiply by 100.","correctAnswer":"75%"},
      {"prompt":"Round 2.345 to 2 dp.","feedback":"Check third decimal.","correctAnswer":"2.35"},
      {"prompt":"Write \\(4000\\) in standard form.","feedback":"Move decimal to 1–10.","correctAnswer":"\\(4 \\times 10^3\\)"}
    ]'::jsonb,
    true
  ),
  (
    'O Level',
    'Mathematics',
    'Number Skills',
    'easy',
    'english',
    4,
    '[
      {"prompt":"Evaluate \\(9 + 6 \\div 3\\).","feedback":"Division before addition.","correctAnswer":"11"},
      {"prompt":"Write \\(0.4\\) as fraction.","feedback":"Simplify.","correctAnswer":"\\(2/5\\)"},
      {"prompt":"Find LCM of 3 and 5.","feedback":"List multiples.","correctAnswer":"15"},
      {"prompt":"Simplify \\(4^2\\).","feedback":"Square number.","correctAnswer":"16"},
      {"prompt":"Simplify \\(\\sqrt{9}\\).","feedback":"Square root.","correctAnswer":"3"},
      {"prompt":"Is 15 prime?","feedback":"Check factors.","correctAnswer":"No"},
      {"prompt":"Convert 3 km to m.","feedback":"1 km = 1000 m.","correctAnswer":"3000"},
      {"prompt":"Write 50% as decimal.","feedback":"Divide by 100.","correctAnswer":"0.5"},
      {"prompt":"Round 5.678 to 1 dp.","feedback":"Check second decimal.","correctAnswer":"5.7"},
      {"prompt":"Write \\(0.02\\) in standard form.","feedback":"Make between 1 and 10.","correctAnswer":"\\(2 \\times 10^{-2}\\)"}
    ]'::jsonb,
    true
  ),
  (
    'O Level',
    'Mathematics',
    'Number Skills',
    'easy',
    'english',
    5,
    '[
      {"prompt":"Evaluate \\(7 \\times 2 + 5\\).","feedback":"Multiply first.","correctAnswer":"19"},
      {"prompt":"Write \\(0.6\\) as fraction.","feedback":"Simplify fraction.","correctAnswer":"\\(3/5\\)"},
      {"prompt":"Find HCF of 12 and 16.","feedback":"List factors.","correctAnswer":"4"},
      {"prompt":"Simplify \\(10^2\\).","feedback":"Square number.","correctAnswer":"100"},
      {"prompt":"Simplify \\(\\sqrt{49}\\).","feedback":"Square root.","correctAnswer":"7"},
      {"prompt":"Is 13 prime?","feedback":"Check divisibility.","correctAnswer":"Yes"},
      {"prompt":"Convert 250 cm to m.","feedback":"100 cm = 1 m.","correctAnswer":"2.5"},
      {"prompt":"Write 0.2 as percentage.","feedback":"Multiply by 100.","correctAnswer":"20%"},
      {"prompt":"Round 9.876 to 2 dp.","feedback":"Check third decimal.","correctAnswer":"9.88"},
      {"prompt":"Write \\(6000\\) in standard form.","feedback":"Move decimal.","correctAnswer":"\\(6 \\times 10^3\\)"}
    ]'::jsonb,
    true
  )
on conflict (education_type, subject, topic, language, difficulty, variant_index) do update
set
  questions = excluded.questions,
  active = true;
