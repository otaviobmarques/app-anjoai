# Vídeo do anjo (abertura do site)

Feito com [Remotion](https://www.remotion.dev) a partir do vetor oficial do anjo (`src/lib/angel-path.ts`).
Duas versões: `AnjoHero` (1920x1080, computador) e `AnjoHeroVertical` (1080x1920, celular), 10 s.

```bash
cd video && npm install
npx remotion studio src/index.ts          # editar vendo ao vivo
npx remotion render src/index.ts AnjoHero out/anjo-hero.webm --codec=vp9 --crf=34
npx remotion render src/index.ts AnjoHero out/anjo-hero.mp4 --codec=h264 --crf=27
npx remotion render src/index.ts AnjoHeroVertical out/anjo-hero-vertical.webm --codec=vp9 --crf=34
npx remotion render src/index.ts AnjoHeroVertical out/anjo-hero-vertical.mp4 --codec=h264 --crf=27
```

Copie os arquivos de `out/` para `site/video/` (e o último quadro, em .webp, para `site/img/`).
