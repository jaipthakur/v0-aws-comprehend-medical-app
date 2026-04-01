# Clinical PHI detection (Amazon Comprehend Medical)

Next.js sample app modeled after the Azure PII redaction flow, but using [**Amazon Comprehend Medical**](https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html) to detect PHI in **English clinical text** and produce a **redacted plain-text** download.

## Differences from the Azure app

| Azure app | This app |
|-----------|----------|
| Async document jobs + Blob Storage | Synchronous `DetectPHI` on extracted text |
| Native PDF/DOCX output from the service | Redacted **`.txt`** (DOCX is read for text only) |
| Azure Language + Storage | AWS Comprehend Medical + default credential chain |

Comprehend Medical is **English (US) only** and is intended for clinical narratives, not general PII in arbitrary documents.

## Setup

1. **AWS account** with Comprehend Medical enabled in a [supported Region](https://docs.aws.amazon.com/general/latest/gr/comprehend-medical.html).
2. **IAM user or role** with `comprehendmedical:DetectPHI` (e.g. attach AWS managed policy `ComprehendMedicalFullAccess` for development only).
3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` (or use an instance/task role and omit keys).

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Limits

- Up to **20,000 Unicode characters** per request after text extraction (AWS limit).
- Supported uploads: **`.txt`** (UTF-8) and **`.docx`** (body text via [mammoth](https://github.com/mwilliamson/mammoth.js)).

## Compliance notice

Amazon Comprehend Medical is a **HIPAA-eligible** service when used under a BAA with AWS, but this repository is a **demo**. Do not use it for patient care without appropriate agreements, security review, and human oversight. See the [service documentation](https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html) (including the important notice on professional judgment and confidence scores).

## License

Private / use at your own risk for prototyping.
