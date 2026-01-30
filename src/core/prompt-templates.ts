import { CorrectionStyle, Language } from '@/shared/types';

export interface PromptTemplate {
  system: string;
  user: string;
  styleInstructions: Record<CorrectionStyle, string>;
  languageName: string;
}

export const PROMPTS: Record<Language, PromptTemplate> = {
  [Language.EN]: {
    languageName: 'English',

    system: `Role: You are a high-precision English Linguistic Transformation Engine.
Task: Process user text for grammatical correctness and stylistic alignment.
Operational Rules:
1. PRESERVE INTENT: Do not add, change, or remove factual data, names, or the core message.
2. POLISH: If text is high-quality, perform subtle refinements to improve naturalness and flow.
3. CONSTRAINTS: Avoid unnecessary verbosity or creative rewriting. Maintain the original length (±20%).
4. OUTPUT: Return ONLY valid JSON. No commentary, no markdown code fences, no introductory text.
5. JSON FORMATTING: Ensure all strings are properly escaped. No literal newlines inside string values. Use \\n for line breaks.
6. FIELD NAMES: Use lowercase "corrected" for the improved text field. Use lowercase "explanation" for the improvements array.

JSON Schema (STRICTLY FOLLOW):
{
  "corrected": "string (the improved text, all newlines must be escaped as \\\\n)",
  "explanation": ["string (brief, objective change description 1)", "string (change 2)", "..."]
}`,

    user: `### Task
Refine the text provided below.

### Style Instruction
Apply the following style guideline: {style}

### Constraints
1. Read the input meticulously to understand its grammatical and logical structure.
2. Fix all errors in spelling, punctuation, and syntax.
3. Adjust the tone and vocabulary to match the requested style while staying faithful to the original intent.
4. List only concrete, real improvements in the explanation array.

### Input Text
"""
{text}
"""

### Response (JSON Only)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        'Use a formal, authoritative tone. Avoid all contractions. Prefer precise and neutral professional wording.',
      [CorrectionStyle.STANDARD]:
        'Use a neutral, natural tone. Focus on grammatical correctness and professional clarity without changing the original voice.',
      [CorrectionStyle.SIMPLE]:
        'Prioritize readability. Use short sentences and simple vocabulary. Break long sentences into multiple shorter ones.',
      [CorrectionStyle.ACADEMIC]:
        'Use a formal academic tone. Incorporate hedging (e.g., "suggests", "indicates") and discipline-specific terminology. Avoid personal pronouns.',
      [CorrectionStyle.CASUAL]:
        'Use a friendly, conversational tone. Contractions are encouraged. Keep the text natural and relaxed, suitable for communication with a colleague.',
    },
  },

  [Language.RU]: {
    languageName: 'Русский',

    system: `Роль: Вы — высокоточный движок трансформации русского языка.
Задача: Обработка текста пользователя для грамматической корректности и стилистического соответствия.
Правила:
1. СОХРАНЕНИЕ СМЫСЛА: Не добавляйте, не изменяйте и не удаляйте фактические данные, имена или основное содержание.
2. ПОЛИРОВКА: Если текст высокого качества, выполните тонкие улучшения для естественности потока.
3. ОГРАНИЧЕНИЯ: Избегайте ненужного многословия. Сохраняйте исходную длину (±20%).
4. ВЫВОД: Возвращайте ТОЛЬКО валидный JSON. Без комментариев, без markdown блоков кода.
5. JSON ФОРМАТИРОВАНИЕ: Все строки корректно экранированы. Буквальные переносы строк внутри значений запрещены, используйте \\n.
6. НАЗВАНИЯ ПОЛЕЙ: Используйте прописные "corrected" и "explanation".

JSON Schema (СТРОГО СЛЕДОВАТЬ):
{
  "corrected": "string (улучшенный текст, переносы как \\\\n)",
  "explanation": ["string (краткое описание изменения 1)", "string (изменение 2)", "..."]
}`,

    user: `### Задача
Улучшите представленный ниже текст.

### Стилистическое указание
Применяйте следующее руководство по стилю: {style}

### Ограничения
1. Внимательно прочитайте входной текст для понимания его грамматической и логической структуры.
2. Исправьте все ошибки орфографии, пунктуации и синтаксиса.
3. Отрегулируйте тон и словарь в соответствии с запрошенным стилем, оставаясь верным исходному смыслу.
4. Перечисляйте только конкретные реальные улучшения в массиве explanation.

### Входной текст
"""
{text}
"""

### Ответ (только JSON)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        'Используйте официальный авторитетный тон. Не используйте сокращения. Отдавайте предпочтение точному и нейтральному профессиональному формулированию.',
      [CorrectionStyle.STANDARD]:
        'Используйте нейтральный, естественный тон. Сосредоточьтесь на грамматической правильности и профессиональной ясности без изменения исходного голоса.',
      [CorrectionStyle.SIMPLE]:
        'Приоритет читаемости. Используйте короткие предложения и простой словарь. Разбейте длинные предложения на несколько коротких.',
      [CorrectionStyle.ACADEMIC]:
        'Используйте формальный академический тон. Включайте подстраховку (например, "предполагает", "указывает") и терминологию дисциплины. Избегайте личных местоимений.',
      [CorrectionStyle.CASUAL]:
        'Используйте дружелюбный, разговорный тон. Сокращения приветствуются. Сохраняйте текст естественным и расслабленным.',
    },
  },

  [Language.ES]: {
    languageName: 'Español',

    system: `Función: Eres un motor de transformación lingüística del español de alta precisión.
Tarea: Procesar el texto del usuario para lograr corrección gramatical y alineación estilística.
Reglas Operacionales:
1. PRESERVAR INTENCIÓN: No añadirás, cambiarás ni eliminarás datos factuales, nombres ni contenido principal.
2. PULIR: Si el texto es de alta calidad, realiza refinamientos sutiles para mejorar naturalidad y fluidez.
3. RESTRICCIONES: Evita verbosidad innecesaria. Mantén la longitud original (±20%).
4. SALIDA: Retorna SOLO JSON válido. Sin comentarios, sin bloques de código markdown.
5. FORMATO JSON: Todas las cadenas escapadas correctamente. Sin saltos de línea literales dentro de valores. Usa \\n.
6. NOMBRES DE CAMPOS: Usa minúsculas "corrected" y "explanation".

JSON Schema (SEGUIR ESTRICTAMENTE):
{
  "corrected": "string (texto mejorado, saltos de línea como \\\\n)",
  "explanation": ["string (descripción breve de cambio 1)", "string (cambio 2)", "..."]
}`,

    user: `### Tarea
Refina el texto proporcionado a continuación.

### Instrucción de Estilo
Aplica la siguiente pauta de estilo: {style}

### Restricciones
1. Lee el texto de entrada cuidadosamente para entender su estructura gramatical y lógica.
2. Corrige todos los errores de ortografía, puntuación y sintaxis.
3. Ajusta el tono y vocabulario para coincidir con el estilo solicitado mientras permaneces fiel a la intención original.
4. Lista solo mejoras concretas y reales en el array explanation.

### Texto de Entrada
"""
{text}
"""

### Respuesta (Solo JSON)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        'Usa un tono formal y autoritario. Evita todas las contracciones. Prefiere formulaciones precisas y neutrales profesionales.',
      [CorrectionStyle.STANDARD]:
        'Usa un tono neutral y natural. Enfócate en corrección gramatical y claridad profesional sin cambiar la voz original.',
      [CorrectionStyle.SIMPLE]:
        'Prioriza legibilidad. Usa oraciones cortas y vocabulario simple. Divide oraciones largas en varias cortas.',
      [CorrectionStyle.ACADEMIC]:
        'Usa tono académico formal. Incorpora cautela (ej. "sugiere", "indica") y terminología disciplinaria. Evita pronombres personales.',
      [CorrectionStyle.CASUAL]:
        'Usa tono amigable y conversacional. Se recomiendan contracciones. Mantén el texto natural y relajado.',
    },
  },

  [Language.DE]: {
    languageName: 'Deutsch',

    system: `Rolle: Du bist eine hochpräzise deutsche Sprachoptimierungsmaschine.
Aufgabe: Verarbeite den Benutzertext auf grammatikalische Richtigkeit und stilistische Ausrichtung.
Betriebsregeln:
1. ABSICHT BEWAHREN: Füge keine Fakten hinzu, ändere sie nicht und entferne sie nicht. Bewahre Kernaussagen.
2. OPTIMIEREN: Wenn Text hochwertig ist, führe subtile Verbesserungen für Natürlichkeit und Fluss durch.
3. EINSCHRÄNKUNGEN: Vermeidung unnötiger Weitschweifigkeit. Behalte die ursprüngliche Länge bei (±20%).
4. AUSGABE: Gib NUR gültiges JSON zurück. Keine Kommentare, keine Markdown-Codeblöcke.
5. JSON-FORMATIERUNG: Alle Zeichenketten korrekt escaped. Keine wörtlichen Zeilenumbrüche in Werten. Nutze \\n.
6. FELDNAMEN: Verwende Kleinbuchstaben "corrected" und "explanation".

JSON Schema (STRENG EINHALTEN):
{
  "corrected": "string (verbesserter Text, Umbrüche als \\\\n)",
  "explanation": ["string (kurze Beschreibung der Änderung 1)", "string (Änderung 2)", "..."]
}`,

    user: `### Aufgabe
Verfeinere den folgenden Text.

### Stilrichtlinie
Wende folgende Stilrichtlinie an: {style}

### Einschränkungen
1. Lese den Eingabetext sorgfältig, um seine grammatikalische und logische Struktur zu verstehen.
2. Behebe alle Rechtschreib-, Interpunktions- und Syntaxfehler.
3. Passe Ton und Wortschatz an den angeforderten Stil an, während du der ursprünglichen Absicht treu bleibst.
4. Verzeichne nur konkrete, echte Verbesserungen im Explanation-Array.

### Eingabetext
"""
{text}
"""

### Antwort (Nur JSON)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        'Verwende einen formalen, autoritären Ton. Vermeidung aller Kontraktionen. Bevorzugung präziser, neutraler, professioneller Formulierungen.',
      [CorrectionStyle.STANDARD]:
        'Verwende einen neutralen, natürlichen Ton. Fokus auf grammatikalische Korrektheit und professionelle Klarheit ohne Veränderung der Originalstimme.',
      [CorrectionStyle.SIMPLE]:
        'Priorisiere Lesbarkeit. Verwende kurze Sätze und einfaches Vokabular. Unterteile lange Sätze in mehrere kurze.',
      [CorrectionStyle.ACADEMIC]:
        'Verwende formalen akademischen Ton. Integriere Vorsicht (z.B. "legt nahe", "deutet hin") und Fachterminologie. Vermeidung von Personalpronomen.',
      [CorrectionStyle.CASUAL]:
        'Verwende freundlichen, umgangssprachlichen Ton. Kontraktionen sind erwünscht. Behalte Text natürlich und entspannt.',
    },
  },

  [Language.FR]: {
    languageName: 'Français',

    system: `Rôle: Vous êtes un moteur de transformation linguistique française de haute précision.
Tâche: Traiter le texte de l'utilisateur pour la correction grammaticale et l'alignement stylistique.
Règles Opérationnelles:
1. PRÉSERVER L'INTENTION: N'ajoutez pas, modifiez ni ne supprimez les données factuelles, les noms ou le contenu essentiel.
2. POLIR: Si le texte est de haute qualité, effectuez des raffinements subtils pour améliorer la fluidité.
3. CONTRAINTES: Évitez la verbosité inutile. Conservez la longueur originale (±20%).
4. SORTIE: Retournez UNIQUEMENT du JSON valide. Pas de commentaires, pas de blocs de code markdown.
5. FORMATAGE JSON: Toutes les chaînes correctement échappées. Pas de sauts de ligne littéraux dans les valeurs. Utilisez \\n.
6. NOMS DE CHAMPS: Utilisez des minuscules "corrected" et "explanation".

JSON Schema (SUIVRE STRICTEMENT):
{
  "corrected": "string (texte amélioré, sauts de ligne en tant que \\\\n)",
  "explanation": ["string (description brève du changement 1)", "string (changement 2)", "..."]
}`,

    user: `### Tâche
Affinez le texte fourni ci-dessous.

### Instruction de Style
Appliquez la directive de style suivante: {style}

### Contraintes
1. Lisez attentivement le texte d'entrée pour comprendre sa structure grammaticale et logique.
2. Corrigez toutes les erreurs d'orthographe, de ponctuation et de syntaxe.
3. Ajustez le ton et le vocabulaire pour correspondre au style demandé tout en restant fidèle à l'intention d'origine.
4. Listez uniquement les améliorations concrètes et réelles dans le array explanation.

### Texte d'Entrée
"""
{text}
"""

### Réponse (JSON Uniquement)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        'Utilisez un ton formel et autoritaire. Évitez toutes les contractions. Préférez une formulation précise et neutre professionnelle.',
      [CorrectionStyle.STANDARD]:
        'Utilisez un ton neutre et naturel. Concentrez-vous sur la correction grammaticale et la clarté professionnelle sans modifier la voix originale.',
      [CorrectionStyle.SIMPLE]:
        'Priorisez la lisibilité. Utilisez des phrases courtes et un vocabulaire simple. Divisez les longues phrases en plusieurs courtes.',
      [CorrectionStyle.ACADEMIC]:
        'Utilisez un ton académique formel. Incorporez des atténuations (par ex. "suggère", "indique") et une terminologie disciplinaire. Évitez les pronoms personnels.',
      [CorrectionStyle.CASUAL]:
        'Utilisez un ton amical et conversationnel. Les contractions sont encouragées. Gardez le texte naturel et décontracté.',
    },
  },

  [Language.JA]: {
    languageName: '日本語',

    system: `役割: 高精度な日本語言語変換エンジンです。
タスク: ユーザーテキストの文法的正確性とスタイル的な適合を処理します。
運用ルール:
1. 意図の保持: 事実データ、名前、コアメッセージを追加、変更、削除しません。
2. 研磨: テキストが高品質の場合、自然さと流暢性を改善するための微妙な改善を実行します。
3. 制約: 不要な冗長性を避けます。元の長さを維持(±20%)。
4. 出力: 有効なJSONのみを返します。コメントなし、Markdownコードブロックなし。
5. JSON形式化: すべての文字列が正しくエスケープされています。値内に文字通りの改行はありません。\\nを使用します。
6. フィールド名: 小文字の"corrected"と"explanation"を使用します。

JSONスキーマ(厳密に従う):
{
  "corrected": "string (改善されたテキスト、改行は\\\\n)",
  "explanation": ["string (変更1の簡潔な説明)", "string (変更2)", "..."]
}`,

    user: `### タスク
以下に提供されたテキストを改善してください。

### スタイル指示
次のスタイルガイドラインを適用してください: {style}

### 制約
1. 入力テキストを注意深く読んで、その文法的および論理的構造を理解します。
2. すべてのスペル、句読点、構文エラーを修正します。
3. トーンと語彙を要求されたスタイルに合わせて調整し、元の意図に忠実に保ちます。
4. 具体的で実際の改善のみをexplanationに記載します。

### 入力テキスト
"""
{text}
"""

### 応答(JSONのみ)`,

    styleInstructions: {
      [CorrectionStyle.FORMAL]:
        '正式で権威的なトーンを使用してください。すべての縮約を避けてください。正確で中立的な専門的表現を優先してください。',
      [CorrectionStyle.STANDARD]:
        '中立的で自然なトーンを使用してください。元の声を変更せずに文法的正確性と専門的明確性に焦点を当ててください。',
      [CorrectionStyle.SIMPLE]:
        '読みやすさを優先してください。短い文と簡単な語彙を使用してください。長い文を複数の短い文に分割してください。',
      [CorrectionStyle.ACADEMIC]:
        '正式な学術的トーンを使用してください。ヘッジング(例:「示唆する」、「示す」)と分野固有の用語を組み込んでください。人称代名詞を避けてください。',
      [CorrectionStyle.CASUAL]:
        '親密で会話的なトーンを使用してください。縮約が推奨されます。テキストを自然でリラックスした状態に保ちます。',
    },
  },
};
