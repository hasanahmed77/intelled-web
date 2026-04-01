with canonical as (
  select
    id,
    '[
      {"prompt":"Evaluate \\(6 + 3 \\times (8 - 5)^2\\).","feedback":"","correctAnswer":"33"},
      {"prompt":"Find the Highest Common Factor (HCF) of 36 and 84.","feedback":"Prime factorisation or listing factors should be used. The HCF is the largest common factor shared by both numbers.","correctAnswer":"12"},
      {"prompt":"Simplify \\(2^3 \\times 2^5 \\div 2^4\\).","feedback":"Use index laws: when multiplying add powers, when dividing subtract powers.","correctAnswer":"\\(2^4\\) or \\(16\\)"},
      {"prompt":"Simplify \\(\\sqrt{50} + \\sqrt{8}\\).","feedback":"Simplify each surd first: \\(\\sqrt{50} = 5\\sqrt{2}\\) and \\(\\sqrt{8} = 2\\sqrt{2}\\), then combine like terms.","correctAnswer":"\\(7\\sqrt{2}\\)"},
      {"prompt":"Rationalise the denominator of \\(\\frac{5}{3 - \\sqrt{2}}\\).","feedback":"Multiply numerator and denominator by the conjugate \\((3 + \\sqrt{2})\\) to remove the surd from the denominator.","correctAnswer":"\\(\\frac{15 + 5\\sqrt{2}}{7}\\)"},
      {"prompt":"State whether \\(\\sqrt{18}\\) is rational or irrational.","feedback":"\\(\\sqrt{18}\\) cannot be written as a terminating or recurring decimal, so it is irrational.","correctAnswer":"Irrational"},
      {"prompt":"A car travels 150 km in 3 hours. Calculate its average speed in km/h.","feedback":"Average speed = distance ÷ time.","correctAnswer":"50 km/h"},
      {"prompt":"Write 0.375 as a fraction in its simplest form.","feedback":"Convert decimal to fraction then simplify by dividing numerator and denominator by their highest common factor.","correctAnswer":"3/8"},
      {"prompt":"Round 3.7865 to 3 significant figures.","feedback":"Keep the first 3 significant digits and check the next digit to round correctly.","correctAnswer":"3.79"},
      {"prompt":"Write 0.00052 in standard form.","feedback":"Standard form is written as \\(a \\times 10^n\\) where \\(1 \\le a < 10\\).","correctAnswer":"\\(5.2 \\times 10^{-4}\\)"}
    ]'::jsonb as questions
  from public.static_question_sets
  where education_type = 'O Level'
    and subject = 'Mathematics'
    and topic = 'Number Skills'
    and language = 'english'
)
update public.static_question_sets sqs
set questions = canonical.questions
from canonical
where sqs.id = canonical.id;

with canonical as (
  select
    id,
    '[
      {"order":1,"correctAnswer":"33","feedback":""},
      {"order":2,"correctAnswer":"12","feedback":"Prime factorisation or listing factors should be used. The HCF is the largest common factor shared by both numbers."},
      {"order":3,"correctAnswer":"\\(2^4\\) or \\(16\\)","feedback":"Use index laws: when multiplying add powers, when dividing subtract powers."},
      {"order":4,"correctAnswer":"\\(7\\sqrt{2}\\)","feedback":"Simplify each surd first: \\(\\sqrt{50} = 5\\sqrt{2}\\) and \\(\\sqrt{8} = 2\\sqrt{2}\\), then combine like terms."},
      {"order":5,"correctAnswer":"\\(\\frac{15 + 5\\sqrt{2}}{7}\\)","feedback":"Multiply numerator and denominator by the conjugate \\((3 + \\sqrt{2})\\) to remove the surd from the denominator."},
      {"order":6,"correctAnswer":"Irrational","feedback":"\\(\\sqrt{18}\\) cannot be written as a terminating or recurring decimal, so it is irrational."},
      {"order":7,"correctAnswer":"50 km/h","feedback":"Average speed = distance ÷ time."},
      {"order":8,"correctAnswer":"3/8","feedback":"Convert decimal to fraction then simplify by dividing numerator and denominator by their highest common factor."},
      {"order":9,"correctAnswer":"3.79","feedback":"Keep the first 3 significant digits and check the next digit to round correctly."},
      {"order":10,"correctAnswer":"\\(5.2 \\times 10^{-4}\\)","feedback":"Standard form is written as \\(a \\times 10^n\\) where \\(1 \\le a < 10\\)."}
    ]'::jsonb as questions
  from public.static_question_sets
  where education_type = 'O Level'
    and subject = 'Mathematics'
    and topic = 'Number Skills'
    and language = 'english'
)
update public.worksheet_answer_keys wak
set questions = canonical.questions
from canonical
where wak.source_set_id = canonical.id;

with canonical as (
  select
    '[
      {"order":1,"prompt":"Evaluate \\(6 + 3 \\times (8 - 5)^2\\)."},
      {"order":2,"prompt":"Find the Highest Common Factor (HCF) of 36 and 84."},
      {"order":3,"prompt":"Simplify \\(2^3 \\times 2^5 \\div 2^4\\)."},
      {"order":4,"prompt":"Simplify \\(\\sqrt{50} + \\sqrt{8}\\)."},
      {"order":5,"prompt":"Rationalise the denominator of \\(\\frac{5}{3 - \\sqrt{2}}\\)."},
      {"order":6,"prompt":"State whether \\(\\sqrt{18}\\) is rational or irrational."},
      {"order":7,"prompt":"A car travels 150 km in 3 hours. Calculate its average speed in km/h."},
      {"order":8,"prompt":"Write 0.375 as a fraction in its simplest form."},
      {"order":9,"prompt":"Round 3.7865 to 3 significant figures."},
      {"order":10,"prompt":"Write 0.00052 in standard form."}
    ]'::jsonb as prompt_map
)
update public.worksheets w
set questions = (
  select jsonb_agg(
    jsonb_set(
      question,
      '{prompt}',
      to_jsonb(
        coalesce(
          (
            select item->>'prompt'
            from jsonb_array_elements(canonical.prompt_map) item
            where (item->>'order')::int = (question->>'order')::int
          ),
          question->>'prompt'
        )
      ),
      false
    )
    order by (question->>'order')::int
  )
  from canonical, jsonb_array_elements(w.questions) question
)
where w.source = 'static'
  and w.subject = 'Mathematics'
  and w.topic = 'Number Skills';
