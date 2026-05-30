-- Seed legacy person records from the previous dump.
-- The legacy firstname/lastname columns contain Arabic names; the current schema
-- stores those in *_arabic and uses rough Latin transcriptions in firstname/lastname.
CREATE OR REPLACE FUNCTION "public"."_zlitni_seed_transcribe_arabic"(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  original TEXT;
  result TEXT;
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;

  original := btrim(value);

  IF original = '' THEN
    RETURN NULL;
  END IF;

  result := CASE original
    WHEN 'ميلاد' THEN 'Milad'
    WHEN 'سالم' THEN 'Salem'
    WHEN 'عبد السلام' THEN 'Abdeslem'
    WHEN 'منا' THEN 'Mna'
    WHEN 'منى' THEN 'Mona'
    WHEN 'مُنى' THEN 'Mona'
    WHEN 'صادق' THEN 'Sadok'
    WHEN 'جنات' THEN 'Jannet'
    WHEN 'حبيبة' THEN 'Habiba'
    WHEN 'جميل' THEN 'Jamil'
    WHEN 'جبران' THEN 'Jobran'
    WHEN 'هاني' THEN 'Heni'
    WHEN 'غاني' THEN 'Ghani'
    WHEN 'أنس' THEN 'Anas'
    WHEN 'مجدي' THEN 'Majdi'
    WHEN 'ميساء' THEN 'Mayssa'
    WHEN 'معتز' THEN 'Moetez'
    WHEN 'رؤى' THEN 'Roaa'
    WHEN 'ريان' THEN 'Rayen'
    WHEN 'إسراء' THEN 'Israa'
    WHEN 'ياسمين' THEN 'Yasmine'
    WHEN 'بهاء' THEN 'Baha'
    WHEN 'أيمن' THEN 'Aymen'
    WHEN 'أيوب' THEN 'Ayoub'
    WHEN 'آدم' THEN 'Adam'
    WHEN 'رنيم' THEN 'Ranim'
    WHEN 'ألاء' THEN 'Alaa'
    WHEN 'نرجس' THEN 'Narjes'
    WHEN 'روضة' THEN 'Rawdha'
    WHEN 'نبيهة' THEN 'Nabiha'
    WHEN 'ضحى' THEN 'Dhoha'
    WHEN 'هشام' THEN 'Hichem'
    WHEN 'سعاد' THEN 'Souad'
    WHEN 'جميلة' THEN 'Jamila'
    WHEN 'مصطفى' THEN 'Mustapha'
    WHEN 'نجيب' THEN 'Najib'
    WHEN 'نجيبة' THEN 'Najiba'
    WHEN 'بهيجة' THEN 'Bahija'
    WHEN 'رضا' THEN 'Ridha'
    WHEN 'حياة' THEN 'Hayet'
    WHEN 'غادة' THEN 'Ghada'
    WHEN 'هيام' THEN 'Houem'
    WHEN 'فائزة' THEN 'Faiza'
    WHEN 'إبراهيم' THEN 'Ibrahim'
    WHEN 'فاطمة' THEN 'Fatma'
    WHEN 'ريم' THEN 'Rim'
    WHEN 'نور الدين' THEN 'Noureddine'
    WHEN 'مسالم' THEN 'Msalem'
    WHEN 'مهدي' THEN 'Mehdi'
    WHEN 'خالد' THEN 'Khaled'
    WHEN 'لطيفة' THEN 'Latifa'
    WHEN 'ملاك' THEN 'Melek'
    WHEN 'يسر' THEN 'Yosr'
    WHEN 'إلياس' THEN 'Ilyes'
    WHEN 'عائشة' THEN 'Aicha'
    WHEN 'صحبي' THEN 'Sahbi'
    WHEN 'حمزة' THEN 'Hamza'
    WHEN 'محمد' THEN 'Mohamed'
    WHEN 'طارق' THEN 'Tarek'
    WHEN 'كريمة' THEN 'Karima'
    WHEN 'زياد' THEN 'Zied'
    WHEN 'زينب' THEN 'Zeineb'
    WHEN 'غالية' THEN 'Ghalia'
    WHEN 'حازم' THEN 'Hazem'
    WHEN 'يوسف' THEN 'Youssef'
    WHEN 'شاهين' THEN 'Chahine'
    WHEN 'منصور' THEN 'Mansour'
    WHEN 'سلمى' THEN 'Salma'
    WHEN 'حميدة' THEN 'Hamida'
    WHEN 'خيرة' THEN 'Khira'
    WHEN 'الهادي' THEN 'Hedi'
    WHEN 'ربيعة' THEN 'Rabiaa'
    WHEN 'نجوى' THEN 'Najwa'
    WHEN 'أميمة' THEN 'Oumaima'
    WHEN 'نضال' THEN 'Nidhal'
    WHEN 'محفوظ' THEN 'Mahfoudh'
    WHEN 'أمل' THEN 'Amal'
    WHEN 'نعيمة' THEN 'Naima'
    WHEN 'كمال' THEN 'Kamel'
    WHEN 'نرمين' THEN 'Nermine'
    WHEN 'فريد' THEN 'Farid'
    WHEN 'هارون' THEN 'Haroun'
    WHEN 'أمين' THEN 'Amine'
    WHEN 'ألفة' THEN 'Olfa'
    WHEN 'درصاف' THEN 'Dorsaf'
    WHEN 'صدام' THEN 'Saddam'
    WHEN 'روان' THEN 'Rawan'
    WHEN 'نبيل' THEN 'Nabil'
    WHEN 'سونيا' THEN 'Sonia'
    WHEN 'فارس' THEN 'Fares'
    WHEN 'ماهر' THEN 'Maher'
    WHEN 'محمد عزيز' THEN 'Mohamed Aziz'
    WHEN 'أريج' THEN 'Arij'
    WHEN 'مراد' THEN 'Mourad'
    WHEN 'نادر' THEN 'Nader'
    WHEN 'مُلكة' THEN 'Molka'
    WHEN 'هيفاء' THEN 'Haifa'
    WHEN 'عوشة' THEN 'Aoucha'
    WHEN 'مختار' THEN 'Mokhtar'
    WHEN 'بشير' THEN 'Bechir'
    WHEN 'عبد الله' THEN 'Abdallah'
    WHEN 'شيخة' THEN 'Chikha'
    WHEN 'صالحة' THEN 'Salha'
    WHEN 'شيوخة' THEN 'Chioukha'
    WHEN 'حبيب' THEN 'Habib'
    WHEN 'علي' THEN 'Ali'
    WHEN 'راقية' THEN 'Rakia'
    WHEN 'سعيد' THEN 'Said'
    WHEN 'بية' THEN 'Beya'
    WHEN 'صلاح' THEN 'Salah'
    WHEN 'حلومة' THEN 'Hallouma'
    WHEN 'احمد' THEN 'Ahmed'
    WHEN 'خدوجة' THEN 'Khadouja'
    WHEN 'طاهر' THEN 'Taher'
    WHEN 'رشيد' THEN 'Rachid'
    WHEN 'منجية' THEN 'Mongia'
    WHEN 'عبيدية' THEN 'Abidia'
    WHEN 'شادلية' THEN 'Chadlia'
    WHEN 'زهرة' THEN 'Zahra'
    WHEN 'سيف' THEN 'Seif'
    WHEN 'سفيان' THEN 'Sofien'
    WHEN 'رمزي' THEN 'Ramzi'
    WHEN 'نوال' THEN 'Nawal'
    WHEN 'فاطمي' THEN 'Fatmi'
    WHEN 'وليد' THEN 'Walid'
    WHEN 'شكري' THEN 'Chokri'
    WHEN 'صابرية' THEN 'Sabriya'
    WHEN 'الحمداني' THEN 'Hamdani'
    WHEN 'جادير' THEN 'Jadir'
    WHEN 'اللطيف' THEN 'Latif'
    WHEN 'أمينة' THEN 'Amina'
    WHEN 'محسن' THEN 'Mohsen'
    WHEN 'وائل' THEN 'Wael'
    WHEN 'وسيم' THEN 'Wassim'
    WHEN 'هيثم' THEN 'Haithem'
    WHEN 'فرحات' THEN 'Farhat'
    WHEN 'فراس' THEN 'Firas'
    WHEN 'فاهمي' THEN 'Fahmi'
    WHEN 'فيصل' THEN 'Faisal'
    WHEN 'رفيقة' THEN 'Rafika'
    WHEN 'قصي' THEN 'Kosay'
    WHEN 'لؤي' THEN 'Loay'
    WHEN 'رضيانة' THEN 'Radhiana'
    WHEN 'جهينة' THEN 'Jouhaina'
    WHEN 'ناجية' THEN 'Najia'
    WHEN 'عز الدين' THEN 'Ezzeddine'
    WHEN 'سامي' THEN 'Sami'
    WHEN 'سميرة' THEN 'Samira'
    WHEN 'سامية' THEN 'Samia'
    WHEN 'عبد القادر' THEN 'Abdelkader'
    WHEN 'منال' THEN 'Manal'
    WHEN 'رانية' THEN 'Rania'
    WHEN 'طه' THEN 'Taha'
    WHEN 'صحر' THEN 'Sahar'
    WHEN 'عبد الرحمان' THEN 'Abderrahmane'
    WHEN 'عبد المجيد' THEN 'Abdelmajid'
    WHEN 'سرين' THEN 'Sirine'
    WHEN 'فرح' THEN 'Farah'
    WHEN 'حنين' THEN 'Hanin'
    WHEN 'إيمان' THEN 'Imen'
    WHEN 'إسكندر' THEN 'Iskandar'
    WHEN 'مالك' THEN 'Malek'
    WHEN 'عمر' THEN 'Omar'
    WHEN 'خديجة' THEN 'Khadija'
    WHEN 'خليل' THEN 'Khalil'
    WHEN 'لينا' THEN 'Lina'
    WHEN 'مجد' THEN 'Majd'
    WHEN 'الزليطني' THEN 'Zlitni'
    WHEN 'بطيخ' THEN 'Batikh'
    WHEN 'الشلاخي' THEN 'Challakhi'
    WHEN 'شبح' THEN 'Chabbah'
    WHEN 'بوفنينة' THEN 'Boufnina'
    WHEN 'عروة' THEN 'Aroua'
    WHEN 'عمر' THEN 'Omar'
    WHEN 'جلالي' THEN 'Jellali'
    WHEN 'بن يوسف' THEN 'Ben Youssef'
    WHEN 'القاضي' THEN 'Gadhi'
    WHEN 'حمادي' THEN 'Hammadi'
    WHEN 'تركي' THEN 'Turki'
    WHEN 'بن عيسى' THEN 'Ben Aissa'
    WHEN 'حوراني' THEN 'Hourani'
    WHEN 'بن هادي' THEN 'Ben Hadi'
    WHEN 'بن عمارة' THEN 'Ben Amara'
    WHEN 'عيساوي' THEN 'Issaoui'
    WHEN 'تويهمي' THEN 'Touihmi'
    WHEN 'عماري' THEN 'Ammari'
    WHEN 'نيفر' THEN 'Naifer'
    WHEN 'عون' THEN 'Aoun'
    WHEN 'طرابلسي' THEN 'Trabelsi'
    WHEN 'سعود' THEN 'Saoud'
    WHEN 'عنان' THEN 'Anane'
    WHEN 'بن محمود' THEN 'Ben Mahmoud'
    WHEN 'العكروت' THEN 'Akrout'
    WHEN 'بن رمضان' THEN 'Ben Romdhane'
    WHEN 'القرقني' THEN 'Karkni'
    WHEN 'دهان' THEN 'Dehan'
    WHEN 'الشاهد' THEN 'Chahed'
    WHEN 'زراع' THEN 'Zaraa'
    WHEN 'تكيتك' THEN 'Tkitek'
    WHEN 'حمروني' THEN 'Hamrouni'
    WHEN 'لرمر' THEN 'Larmer'
    WHEN 'بن جمهة' THEN 'Ben Jemha'
    WHEN 'زراه' THEN 'Zarrah'
    WHEN 'ميميتة' THEN 'Mimita'
    WHEN 'جراد' THEN 'Jrad'
    WHEN 'يادر' THEN 'Yader'
    WHEN 'الغدي' THEN 'Ghoddi'
    WHEN 'بن حمد' THEN 'Ben Hmed'
    WHEN 'ميزان' THEN 'Mizen'
    WHEN 'قوجا' THEN 'Gouja'
    WHEN 'دزيري' THEN 'Dziri'
    WHEN 'بن حديد' THEN 'Ben Hadid'
    WHEN 'مزابي' THEN 'Mzabi'
    WHEN 'الزيادي' THEN 'Zeyadi'
    WHEN 'بن حمودة' THEN 'Ben Hamouda'
    WHEN 'عيادي' THEN 'Ayadi'
    WHEN 'المؤدب' THEN 'Meddeb'
    WHEN 'فيتوري' THEN 'Fitouri'
    WHEN 'فرجاني' THEN 'Ferjani'
    WHEN 'بوغزو' THEN 'Boughzou'
    WHEN 'داود' THEN 'Daoud'
    WHEN 'أورغي' THEN 'Ourghi'
    WHEN 'خياطي' THEN 'Khayati'
    ELSE original
  END;

  IF result <> original THEN
    RETURN result;
  END IF;

  result := replace(result, 'أ', 'a');
  result := replace(result, 'إ', 'i');
  result := replace(result, 'آ', 'a');
  result := replace(result, 'ا', 'a');
  result := replace(result, 'ب', 'b');
  result := replace(result, 'ت', 't');
  result := replace(result, 'ث', 'th');
  result := replace(result, 'ج', 'j');
  result := replace(result, 'ح', 'h');
  result := replace(result, 'خ', 'kh');
  result := replace(result, 'د', 'd');
  result := replace(result, 'ذ', 'dh');
  result := replace(result, 'ر', 'r');
  result := replace(result, 'ز', 'z');
  result := replace(result, 'س', 's');
  result := replace(result, 'ش', 'ch');
  result := replace(result, 'ص', 's');
  result := replace(result, 'ض', 'dh');
  result := replace(result, 'ط', 't');
  result := replace(result, 'ظ', 'dh');
  result := replace(result, 'ع', 'a');
  result := replace(result, 'غ', 'gh');
  result := replace(result, 'ف', 'f');
  result := replace(result, 'ق', 'k');
  result := replace(result, 'ك', 'k');
  result := replace(result, 'ل', 'l');
  result := replace(result, 'م', 'm');
  result := replace(result, 'ن', 'n');
  result := replace(result, 'ه', 'h');
  result := replace(result, 'و', 'ou');
  result := replace(result, 'ي', 'i');
  result := replace(result, 'ى', 'a');
  result := replace(result, 'ة', 'a');
  result := replace(result, 'ء', '');
  result := replace(result, 'ؤ', 'ou');
  result := replace(result, 'ئ', 'i');
  result := translate(result, 'ًٌٍَُِّْـٰ', '');

  RETURN NULLIF(initcap(btrim(regexp_replace(result, '[[:space:]]+', ' ', 'g'))), '');
END;
$$;

DROP TABLE IF EXISTS "public"."_legacy_person_seed";

CREATE TABLE "public"."_legacy_person_seed" (
  "id" INTEGER PRIMARY KEY,
  "is_male" BOOLEAN,
  "firstname" TEXT,
  "lastname" TEXT,
  "is_alive" BOOLEAN,
  "birth_year" INTEGER,
  "birth_month" INTEGER,
  "birth_day" INTEGER,
  "death_year" INTEGER,
  "death_month" INTEGER,
  "death_day" INTEGER,
  "birth_place" TEXT,
  "birth_country" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

INSERT INTO "public"."_legacy_person_seed" ("id", "is_male", "firstname", "lastname", "is_alive", "birth_year", "birth_month", "birth_day", "death_year", "death_month", "death_day", "birth_place", "birth_country", "created_at", "updated_at") VALUES
(1, true, 'ميلاد', 'الزليطني', false, 1820, null, null, null, null, null, 'Zliten', 'Libya', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(2, true, 'سالم', 'الزليطني', false, 1858, null, null, null, null, null, 'Zliten', 'Libya', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(3, true, 'عبد السلام', 'الزليطني', false, 1870, null, null, null, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(4, false, 'منا', 'الزليطني', false, null, null, null, null, null, null, 'Tripoli', 'Libya', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(5, true, 'صادق', 'الزليطني', false, 1898, null, null, 1978, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(6, false, 'جنات', 'بطيخ', false, 1908, null, null, 1988, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(7, true, 'سالم', 'الزليطني', false, 1934, 5, 15, 2011, 9, 13, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(8, false, 'حبيبة', 'الشلاخي', true, 1945, 1, 22, null, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(9, true, 'جميل', 'الزليطني', true, 1966, 9, 16, null, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(10, true, 'جبران', 'الزليطني', true, 1968, 2, 11, null, null, null, 'Djerba', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(11, true, 'هاني', 'الزليطني', true, 1970, 2, 11, null, null, null, 'Tripoli', 'Tunisia', '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(12, true, 'غاني', 'الزليطني', true, 1977, 7, 8, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(13, false, 'أنس', 'الزليطني', true, 1982, 5, 8, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(14, true, 'مجدي', 'الزليطني', true, 1999, 5, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(15, false, 'ميساء', 'الزليطني', true, 2002, 8, null, null, null, null, 'Tataouine', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(16, true, 'معتز', 'الزليطني', true, 2005, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(17, false, 'رؤى', 'الزليطني', true, 2002, 8, 30, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(18, true, 'ريان', 'الزليطني', true, 2002, 8, 30, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(19, false, 'إسراء', 'الزليطني', true, 2008, 5, 14, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(20, false, 'ياسمين', 'الزليطني', true, 1999, 6, 26, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(21, true, 'بهاء', 'الزليطني', true, 2003, 6, 10, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(22, true, 'أيمن', 'الزليطني', true, 2009, 6, 2, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(23, true, 'أيوب', 'الزليطني', true, 2010, 12, 9, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(24, true, 'آدم', 'الزليطني', true, 2014, 3, 16, null, null, null, 'Abha', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(25, false, 'رنيم', 'شبح', true, 2012, null, null, null, null, null, 'Beijing', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(26, false, 'ألاء', 'شبح', true, 2016, null, null, null, null, null, 'Beijing', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(27, false, 'نرجس', 'بوفنينة', true, 1968, null, null, null, null, null, 'Tataouine', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(28, false, 'روضة', 'عروة', true, 1969, 3, 2, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(29, false, 'نبيهة', 'عمر', true, 1974, 6, 2, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(30, false, 'ضحى', 'جلالي', true, 1977, 10, 5, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(31, true, 'هشام', 'شبح', true, 1979, null, null, null, null, null, 'Sousse', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(32, true, 'عبد السلام', 'الزليطني', false, 1925, null, null, 1995, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(33, false, 'سعاد', 'بن يوسف', false, 1933, null, null, 2012, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(34, false, 'جميلة', 'بطيخ', false, 1930, null, null, 2012, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(35, true, 'مصطفى', 'الزليطني', false, 1949, null, null, 1949, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(36, true, 'نجيب', 'الزليطني', true, 1950, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(37, false, 'نجيبة', 'الزليطني', true, 1952, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(38, false, 'بهيجة', 'الزليطني', true, 1954, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(39, true, 'رضا', 'الزليطني', true, 1957, 2, 20, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(40, false, 'حياة', 'الزليطني', true, 1960, 6, 13, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(41, false, 'غادة', 'الزليطني', true, 1980, 6, 17, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(42, false, 'مُنى', 'الزليطني', true, 1981, 5, 10, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(43, false, 'هيام', 'الزليطني', true, 1985, 9, 4, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(44, false, 'فائزة', 'القاضي', true, 1951, 1, 31, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(45, true, 'إبراهيم', 'بطيخ', true, 1953, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(46, false, 'فاطمة', 'بطيخ', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(47, false, 'ريم', 'بطيخ', false, 1979, 5, 30, 2013, 8, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(48, true, 'نور الدين', 'بطيخ', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(49, true, 'مسالم', 'حمادي', true, 1953, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(50, true, 'مجدي', 'حمادي', true, 1988, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(51, false, 'مروى', 'حمادي', true, 1990, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(52, true, 'مهدي', 'حمادي', true, 1994, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(53, true, 'خالد', 'الزليطني', true, 1963, 5, 25, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(54, false, 'لطيفة', 'تركي', true, 1975, 5, 5, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(55, false, 'ملاك', 'الزليطني', true, 2000, 4, 5, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(56, false, 'يسر', 'الزليطني', true, 2003, 10, 21, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(57, true, 'إلياس', 'الزليطني', true, 2009, 1, 13, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(58, false, 'عائشة', 'بن عيسى', true, 1963, 3, 4, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(59, true, 'صحبي', 'بطيخ', true, 1959, 5, 4, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(60, true, 'حمزة', 'الزليطني', true, 1988, 5, 29, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(61, true, 'محمد', 'الزليطني', true, 1992, 11, 20, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(62, true, 'طارق', 'الزليطني', true, 1985, 5, 21, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(63, false, 'كريمة', 'حوراني', null, 1986, 5, 15, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(64, false, 'جنات', 'الزليطني', true, 2012, 3, 27, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(65, true, 'زياد', null, true, 1982, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(66, false, 'زينب', null, true, 2010, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(67, false, 'غالية', null, true, 2015, 5, 18, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(68, true, 'حازم', 'بن عيسى', true, 1972, 12, 10, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(69, true, 'يوسف', 'بن عيسى', true, 2008, 10, 21, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(70, true, 'شاهين', 'بن عيسى', true, 2011, 7, 25, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(71, true, 'آدم', 'بن عيسى', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(72, true, 'منصور', 'بطيخ', true, 1974, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(73, false, 'سلمى', 'بطيخ', true, 2006, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(74, true, 'محمد', 'بطيخ', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(75, true, 'سيف الدين', 'بطيخ', true, 2010, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(76, true, 'حميدة', 'الزليطني', false, 1929, null, null, 2005, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(77, false, 'خيرة', 'جابر', true, 1934, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(78, true, 'الهادي', 'الزليطني', true, 1950, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(79, false, 'ربيعة', 'عنان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(80, false, 'نجوى', 'بالكعب', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(81, false, 'أميمة', 'الزليطني', true, 1983, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(82, true, 'نضال', 'الزليطني', true, 1987, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(83, false, 'سعاد', 'الزليطني', true, 1953, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(84, true, 'محفوظ', 'بن هادي', true, 1946, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(85, false, 'كريمة', 'بن هادي', true, 1982, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(86, false, 'أمل', 'الزليطني', true, 1956, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(87, true, 'رضا', 'بن عمارة', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(88, true, 'مروان', 'بن عمارة', true, 1981, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(89, false, 'هاجر', 'بن عمارة', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(90, true, 'يوسف', 'بن عمارة', true, 2010, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(91, false, 'مريم', 'بن عمارة', true, 2014, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(92, false, 'نعيمة', 'الزليطني', true, 1958, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(93, true, 'كمال', 'عيساوي', true, 1948, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(94, true, 'محمد', 'عيساوي', true, 1988, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(95, false, 'نرمين', 'تويهمي', true, 1988, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(96, true, 'فريد', 'عيساوي', true, 2014, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(97, true, 'هارون', 'عيساوي', true, 2018, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(98, true, 'أمين', 'عيساوي', true, 1991, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(99, false, 'ألفة', 'عماري', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(100, false, 'درصاف', 'عيساوي', true, 1994, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(101, true, 'صدام', 'نيفر', true, 1991, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(102, false, 'روان', 'نيفر', true, 2020, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(103, true, 'نبيل', 'الزليطني', true, 1960, 2, 20, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(104, false, 'سونيا', 'عون', true, 1969, 9, 5, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(105, true, 'مهدي', 'الزليطني', true, 1992, 12, 18, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(106, true, 'فارس', 'الزليطني', true, 1999, 6, 7, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(107, true, 'ماهر', 'الزليطني', true, 1999, 6, 7, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(108, true, 'محمد عزيز', 'الزليطني', true, 1999, 6, 7, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(109, false, 'أريج', 'طرابلسي', true, 1997, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(110, true, 'مراد', 'الزليطني', true, 1962, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(111, false, 'نجيبة', 'سعود', true, 1962, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(112, true, 'نادر', 'الزليطني', true, 1991, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(113, false, 'مُلكة', 'الزليطني', true, 1992, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(114, false, 'هيفاء', 'الزليطني', true, 1997, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(115, false, 'عوشة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(116, false, 'فاطمة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(117, false, 'زينب', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(118, true, 'مختار', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(119, true, 'بشير', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(120, true, null, 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(121, true, null, 'بن محمود', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(122, true, null, 'العكروت', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(123, false, 'مُنى', 'بن رمضان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(124, false, 'شيخة', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(125, false, 'صالحة', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(126, false, 'شيوخة', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(127, true, 'حبيب', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(128, true, 'علي', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(129, true, 'عبد الله', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(130, false, 'عوشة', 'بن محمود', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(131, true, 'يوسف', 'القرقني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(132, true, null, 'العكروت', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(133, false, null, 'دهان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(134, false, 'راقية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(135, true, 'سعيد', 'الشاهد', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(136, false, 'بية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(137, true, 'صلاح', 'الشاهد', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(138, false, 'حلومة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(139, true, 'عبد الله', 'زراع', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(140, false, 'فاطمة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(141, true, 'احمد', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(142, true, 'محمد', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(143, true, 'منصور', 'الزليطني', false, 1867, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(144, true, 'احمد', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(145, false, 'خدوجة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(146, true, 'سالم', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(147, true, 'حبيب', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(148, true, 'طاهر', 'الزليطني', false, 1885, null, null, 1960, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(149, false, 'جنات', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(150, true, 'محمد', 'الزليطني', false, 1915, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(151, true, 'رشيد', 'الزليطني', false, 1940, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(152, false, 'سعاد', 'تكيتك', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(153, false, 'منجية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(154, true, 'إبراهيم', 'حمروني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(155, false, 'عبيدية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(156, false, 'شادلية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(157, true, null, 'لرمر', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(158, false, 'لطيفة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(159, false, null, 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(160, false, 'زهرة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(161, true, 'علي', 'بن جمهة', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(162, true, 'سيف', 'بن جمهة', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(163, true, 'سفيان', 'بن جمهة', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(164, false, 'ريم', 'عنان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(165, true, 'رمزي', 'عنان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(166, true, 'نوال', 'عنان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(167, true, 'فاطمي', 'لرمر', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(168, true, 'أمين', 'لرمر', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(169, true, 'مهدي', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(170, true, 'ماهر', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(171, false, 'مها', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(172, false, 'مريم', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(173, false, 'نائلة', 'حمروني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(174, true, 'نعمان', 'حمروني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(175, true, 'مجد', 'حمروني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(176, false, 'عفاف', 'حمروني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(177, true, 'وليد', 'الزليطني', true, 1977, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(178, true, 'طاهر', 'الزليطني', true, 1975, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(179, false, 'نجوى', 'الزليطني', true, 1972, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(180, true, 'شكري', 'زراه', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(181, true, 'بشير', 'الزليطني', false, 1885, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(182, true, 'احمد', 'الزليطني', false, 1889, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(183, true, 'علي', 'الزليطني', false, 1887, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(184, false, 'صابرية', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(185, false, 'جميلة', 'الزليطني', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(186, true, null, 'ميميتة', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(187, false, 'خدوجة', null, false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(188, true, 'الحمداني', 'جراد', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(189, false, 'فاطمة', 'الزليطني', false, 1920, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(190, true, null, 'يادر', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(191, true, 'سالم', 'الزليطني', false, 1923, null, null, 1982, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(192, false, 'صالحة', 'عنان', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(193, true, 'اللطيف', 'الزليطني', false, 1947, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(194, false, 'جادير', 'يادر', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(195, true, 'منصور', 'الزليطني', false, 1948, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(196, false, 'أمينة', 'الزليطني', false, 1950, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(197, true, null, 'بطيخ', false, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(198, false, 'بشيرة', 'الزليطني', true, 1955, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(199, true, null, 'الغدي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(200, true, 'محسن', 'الزليطني', true, 1956, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(201, false, 'سامية', 'عنان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(202, false, 'أمل', 'الزليطني', true, 1965, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(203, true, null, 'بن حمد', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(204, true, 'وائل', 'بن حمد', true, 1998, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(205, true, 'وسيم', 'بن حمد', true, 1992, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(206, true, 'هيثم', 'بن حمد', true, 1987, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(207, false, 'أميمة', 'الزليطني', true, 1990, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(208, true, 'فرحات', 'ميزان', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(209, true, 'فراس', 'الزليطني', true, 1988, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(210, false, 'خديجة', 'حمروني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(211, false, 'ميساء', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(212, true, 'أسامة', 'الزليطني', true, 1989, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(213, false, null, 'قوجا', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(214, true, 'فاهمي', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(215, true, 'علي', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(216, true, 'مراد', 'الزليطني', true, 1988, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(217, false, null, 'دزيري', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(218, true, 'فيصل', 'الزليطني', true, 1976, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(219, false, 'زينب', 'القاضي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(220, true, 'أيمن', null, true, 1980, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(221, true, 'محمد', 'الزليطني', true, 1975, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(222, false, 'لمية', 'بن حديد', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(223, false, 'رفيقة', 'الزليطني', true, 1970, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(224, true, 'حبيب', 'الزليطني', true, 1969, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(225, false, 'كريمة', 'بن هادي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(226, false, null, 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(227, true, 'قصي', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(228, true, 'لؤي', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(229, false, 'رضيانة', 'الزليطني', true, 2002, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(230, false, 'جهينة', 'الزليطني', true, 2000, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(231, true, 'بشير', 'الزليطني', false, 1937, 1, 17, 2014, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(232, false, 'زينب', 'مزابي', false, 1946, 8, 18, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(233, false, 'ناجية', 'الزليطني', true, 1943, 3, 15, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(234, true, 'عز الدين', 'الزيادي', true, 1937, 4, 16, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(235, true, 'احمد', 'الزليطني', true, 1946, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(236, false, 'شافية', 'بن حمودة', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(237, true, 'حبيب', 'الزليطني', true, 1949, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(238, false, 'راضية', 'عيادي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(239, true, 'سامي', 'الزليطني', true, 1973, 7, 13, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(240, false, 'سميرة', 'الزليطني', true, 1970, 12, 30, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(241, true, 'رضا', 'المؤدب', true, 1959, 5, 8, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(242, false, 'سامية', 'الزليطني', true, 1967, 12, 24, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(243, true, 'كمال', 'حمروني', true, 1962, 12, 8, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(244, false, 'سونيا', 'الزليطني', true, 1966, 9, 13, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(245, true, 'عبد القادر', 'فيتوري', true, 1955, 9, 12, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(246, false, 'سلمى', 'فيتوري', true, 1990, 4, 3, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(247, true, 'ياسين', 'فيتوري', true, 1998, 8, 21, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(248, false, 'منال', 'حمروني', true, 1992, 8, 30, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(249, false, 'رانية', 'حمروني', true, 1996, 3, 13, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(250, true, 'طه', 'حمروني', true, 2003, 3, 28, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(251, false, 'صحر', 'المؤدب', true, 1995, 24, 27, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(252, true, 'علي', 'المؤدب', true, 1997, 4, 19, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(253, true, 'سيف', 'المؤدب', true, 2003, 12, 28, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(254, false, 'نادية', 'الزيادي', true, 1966, 12, 25, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(255, true, 'عبد الرحمان', 'فرجاني', true, 1958, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(256, false, 'نائلة', 'الزيادي', true, 1969, 8, 8, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(257, true, 'عبد المجيد', 'بوغزو', true, 1966, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(258, false, 'ألفة', 'الزيادي', true, 1973, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(259, true, 'الأمجد', 'الشلاخي', true, 1964, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(260, false, 'غادة', 'فرجاني', true, 1995, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(261, true, 'عزيز', 'بوغزو', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(262, false, 'سرين', 'بوغزو', true, 2002, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(263, false, 'عائشة', 'بوغزو', true, 2008, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(264, false, 'فرح', 'الشلاخي', true, 1999, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(265, true, 'احمد', 'الشلاخي', true, 2001, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(266, true, 'أمين', 'الشلاخي', true, 2005, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(267, false, 'حنين', 'الزليطني', true, 1974, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(268, true, 'حاتم', 'داود', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(269, false, 'إيمان', 'الزليطني', true, 1978, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(270, true, 'مهدي', 'أورغي', true, 1978, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(271, true, 'صادق', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(272, false, 'سارة', 'خياطي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(273, true, 'إسكندر', 'الزليطني', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(274, true, 'مالك', 'أورغي', true, null, null, null, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(275, true, 'عمر', 'داود', true, 2003, null, null, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(276, true, 'خديجة', 'داود', true, null, null, null, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(277, true, 'خليل', 'داود', true, null, null, null, null, null, null, 'Tunis', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(278, true, 'احمد', 'بطيخ', true, 2001, 1, 21, null, null, null, 'Djerba', null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(279, false, 'لينا', 'الزليطني', true, null, null, null, null, null, null, null, null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00'),
(280, true, 'مجد', 'الزليطني', true, null, null, null, null, null, null, null, null, '2025-08-31 13:18:16.052041+00', '2025-08-31 13:18:16.052041+00')
;

INSERT INTO "public"."persons" (
  "id",
  "parent_marriage_id",
  "firstname_arabic",
  "middlename_arabic",
  "lastname_arabic",
  "firstname",
  "middlename",
  "lastname",
  "is_male",
  "is_alive",
  "birth_year",
  "birth_month",
  "birth_day",
  "birth_city",
  "birth_country",
  "death_year",
  "death_month",
  "death_day",
  "created_at",
  "updated_at"
)
SELECT
  seed."id",
  NULL,
  seed."firstname",
  NULL,
  seed."lastname",
  "public"."_zlitni_seed_transcribe_arabic"(seed."firstname"),
  NULL,
  "public"."_zlitni_seed_transcribe_arabic"(seed."lastname"),
  seed."is_male",
  seed."is_alive",
  seed."birth_year",
  seed."birth_month",
  seed."birth_day",
  seed."birth_place",
  CASE seed."birth_country"
    WHEN 'Libya' THEN 'LY'
    WHEN 'Tunisia' THEN 'TN'
    ELSE NULL
  END,
  seed."death_year",
  seed."death_month",
  seed."death_day",
  seed."created_at" AT TIME ZONE 'UTC',
  seed."updated_at" AT TIME ZONE 'UTC'
FROM "public"."_legacy_person_seed" AS seed
ON CONFLICT ("id") DO UPDATE SET
  "firstname_arabic" = EXCLUDED."firstname_arabic",
  "middlename_arabic" = EXCLUDED."middlename_arabic",
  "lastname_arabic" = EXCLUDED."lastname_arabic",
  "firstname" = EXCLUDED."firstname",
  "middlename" = EXCLUDED."middlename",
  "lastname" = EXCLUDED."lastname",
  "is_male" = EXCLUDED."is_male",
  "is_alive" = EXCLUDED."is_alive",
  "birth_year" = EXCLUDED."birth_year",
  "birth_month" = EXCLUDED."birth_month",
  "birth_day" = EXCLUDED."birth_day",
  "birth_city" = EXCLUDED."birth_city",
  "birth_country" = EXCLUDED."birth_country",
  "death_year" = EXCLUDED."death_year",
  "death_month" = EXCLUDED."death_month",
  "death_day" = EXCLUDED."death_day",
  "updated_at" = EXCLUDED."updated_at";

SELECT setval(
  pg_get_serial_sequence('public.persons', 'id'),
  COALESCE((SELECT MAX("id") FROM "public"."persons"), 1),
  true
);

DROP TABLE IF EXISTS "public"."_legacy_person_seed";

DROP FUNCTION "public"."_zlitni_seed_transcribe_arabic"(TEXT);
