---
name: welocalize-brand-guidelines
description: "Welocalize brand guidelines for creating on-brand presentations. Use when creating PowerPoint presentations for Welocalize, applying Welocalize branding to slides, or needing reference for Welocalize brand colors, fonts, and visual standards. MANDATORY TRIGGERS: Welocalize, WL brand, welocalize presentation, welocalize slides, welocalize deck"
---

# Welocalize Brand Guidelines

Create on-brand Welocalize presentations using the official SAGE color palette and typography standards.

## Color Palette (SAGE COLOR PALETTE 2)

| Role | Hex | Usage |
|------|-----|-------|
| **Primary Text** | `#262626` | Main body text, dark backgrounds |
| **White** | `#FFFFFF` | Light backgrounds, reversed text |
| **Deep Blue** | `#1A5979` | Secondary dark, followed links |
| **Off-White** | `#F3F3F5` | Light backgrounds, subtle fills |
| **Dark Green** | `#01473B` | Primary brand accent |
| **Blue** | `#077AB5` | Secondary accent |
| **Green** | `#379C4F` | Tertiary accent |
| **Teal/Cyan** | `#05E1C7` | Highlight accent, hyperlinks |
| **Orange** | `#DD7523` | Warm accent |
| **Gold** | `#FFB300` | Warm accent |

### Color Usage Rules

- **Title slides**: Use gradient backgrounds (blue → off-white → dark green)
- **Content slides**: White or off-white (`#F3F3F5`) backgrounds
- **Text on dark**: Use white (`#FFFFFF`)
- **Text on light**: Use primary text (`#262626`)
- **Hyperlinks**: Teal (`#05E1C7`)

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Titles** | Montserrat | Bold | 32pt |
| **Body Level 1** | Noto Sans | Regular | 16pt |
| **Body Level 2-3** | Noto Sans Medium | Medium | 14-16pt |
| **Body Level 4-5** | Noto Sans Medium | Medium | 12pt |
| **Footer/Date** | Noto Sans Medium | Medium | 12pt |

### Typography Rules

- Titles: Montserrat Bold, left-aligned
- Body text: Noto Sans family, left-aligned
- Bullet character: `•` (Arial font)
- Line spacing: 90%
- Space before paragraphs: 10pt (body), 5pt (sub-levels)

## Creating Presentations with pptxgenjs

```javascript
const pptx = new pptxgen();

// Welocalize slide dimensions
pptx.defineLayout({ name: 'WL_LAYOUT', width: 13.333, height: 7.5 });
pptx.layout = 'WL_LAYOUT';

// Title slide with brand color
const slide = pptx.addSlide();
slide.background = { color: '01473B' };  // Dark green

slide.addText('Presentation Title', {
  x: 0.5, y: 2.5, w: '90%',
  fontSize: 32,
  fontFace: 'Montserrat',
  bold: true,
  color: 'FFFFFF'
});

// Content slide
const contentSlide = pptx.addSlide();
contentSlide.background = { color: 'F3F3F5' };

contentSlide.addText('Section Title', {
  x: 0.5, y: 0.3, w: '90%',
  fontSize: 32,
  fontFace: 'Montserrat',
  bold: true,
  color: '262626'
});

contentSlide.addText('Body content here', {
  x: 0.5, y: 1.5, w: '90%',
  fontSize: 16,
  fontFace: 'Noto Sans',
  color: '262626'
});
```

## Quality Checklist

- [ ] All titles use Montserrat Bold
- [ ] Body text uses Noto Sans family
- [ ] Colors match SAGE palette exactly
- [ ] Consistent spacing and alignment
