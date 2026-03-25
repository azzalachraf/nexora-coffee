# Nexora Coffee

Nexora Coffee is a premium product-storytelling website built around a cinematic scroll-driven iced coffee explosion sequence.

The experience uses a 113-frame image sequence rendered on `canvas` with GSAP + ScrollTrigger to create an Apple-style product reveal as the user scrolls.

## Live Demo

[View Live Demo](https://azzalachraf.github.io/nexora-coffee/)

## Preview

![Nexora Coffee Desktop](./screenshots/nexora-desktop.png)

## Highlights

- Cinematic hero section with a scroll-controlled frame sequence
- 113 pre-rendered PNG frames for smooth cup explosion storytelling
- Canvas-based animation rendering
- GSAP + ScrollTrigger powered interactions
- Premium dark visual direction inspired by luxury product pages
- Responsive layout for desktop and mobile
- Feature section, testimonial carousel, and CTA flow

## Built With

- HTML5
- CSS3
- JavaScript
- GSAP
- ScrollTrigger
- HTML Canvas

## Project Structure

```text
.
|-- assets/
|-- frames/
|-- screenshots/
|-- index.html
|-- style.css
|-- script.js
```

## How It Works

The hero animation is powered by a sequence of 113 PNG frames stored in the `frames/` directory. As the page scrolls, GSAP maps scroll progress to frame progress, and each frame is drawn to the hero canvas for a smooth cinematic reveal.

## Local Usage

1. Clone the repository
2. Open the project folder
3. Run it with a local server
4. Open `index.html` in the browser if your environment allows local asset loading

## Deployment

This repository is configured for GitHub Pages deployment through GitHub Actions.

After GitHub Pages finishes deploying, the site will be available at:

[https://azzalachraf.github.io/nexora-coffee/](https://azzalachraf.github.io/nexora-coffee/)

## Author

Created by [@azzalachraf](https://github.com/azzalachraf)
