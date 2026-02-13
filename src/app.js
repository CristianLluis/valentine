import { getSlide, SlideInteractionController } from "./slideController.js";

const slidesRoot = document.getElementById("slides");
let activeSlide = null;

function renderBackgroundBubbles() {
  const layer = document.createElement("div");
  layer.id = "bubble-layer";

  const viewportArea = window.innerWidth * window.innerHeight;
  const bubbleCount = Math.max(12, Math.min(30, Math.round(viewportArea / 70000)));

  for (let i = 0; i < bubbleCount; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "bg-bubble";

    const size = 44 + Math.random() * 180;
    const blur = Math.round(size * (0.2 + Math.random() * 0.2));
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const alpha = 0.11 + Math.random() * 0.13;
    const orbitX = 18 + Math.random() * 62;
    const orbitY = 14 + Math.random() * 54;
    const duration = 44 + Math.random() * 56;
    const delay = -Math.random() * duration;

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}%`;
    bubble.style.top = `${y}%`;
    bubble.style.filter = `blur(${blur}px)`;
    bubble.style.backgroundColor = `rgba(109, 31, 61, ${alpha.toFixed(3)})`;
    bubble.style.setProperty("--orbit-x", `${orbitX.toFixed(1)}px`);
    bubble.style.setProperty("--orbit-y", `${orbitY.toFixed(1)}px`);
    bubble.style.setProperty("--bubble-duration", `${duration.toFixed(1)}s`);
    bubble.style.setProperty("--bubble-delay", `${delay.toFixed(1)}s`);

    layer.appendChild(bubble);
  }

  document.body.prepend(layer);
}

class SlideRenderer {
  render(slide) {
    if (slide.template !== "two_buttons") {
      return this.renderOneButtonTemplate(slide);
    }

    return this.renderTwoButtonsTemplate(slide);
  }

  composeClassNames(...classNames) {
    return classNames.filter(Boolean).join(" ");
  }

  renderTitle(text, className = "title") {
    return `<p class="${className}">${text || ""}</p>`;
  }

  renderButton(id, className, label) {
    return `
      <button id="${id}" class="${className}" type="button">
        ${label || ""}
      </button>
    `;
  }

  renderContainer(content) {
    return `
      <main class="container">
        <section class="view">
          ${content}
        </section>
      </main>
    `;
  }

  renderSlideImages(slide) {
    if (!slide.img) {
      return "";
    }

    if (Array.isArray(slide.img)) {
      return `
        <div class="gift-row">
          ${slide.img
            .map(
              (src) => `
                <div class="img-container gift-item">
                  <img class="gift-image" src="${src}" width="280" height="180" />
                </div>
              `,
            )
            .join("")}
        </div>
      `;
    }

    const imgClass = slide.imgClass || "story-image";

    return `
      <div class="img-container">
        <img id="slide-image" class="${imgClass}" src="${slide.img}" width="340" height="200" />
      </div>
    `;
  }

  renderOneButtonTemplate(slide) {
    const config = slide.config ?? {};
    const titleClass = this.composeClassNames("title", config.titleClass);
    const button1Class = this.composeClassNames("button-base", config.button1Class);
    const buttonMarkup = slide.button1
      ? `
        <div class="next-button-row">
          ${this.renderButton("next-btn", button1Class, slide.button1)}
        </div>
      `
      : "";

    return this.renderContainer(`
      ${this.renderSlideImages(slide)}
      ${this.renderTitle(slide.text, titleClass)}
      ${buttonMarkup}
    `);
  }

  renderTwoButtonsTemplate(slide) {
    const config = slide.config ?? {};
    const titleClass = this.composeClassNames("title", config.titleClass);
    const yesButtonClass = this.composeClassNames(
      "button-base",
      "choice-btn",
      "choice-yes",
      config.button1Class,
    );
    const noButtonClass = this.composeClassNames(
      "button-base",
      "choice-btn",
      "choice-no",
      config.button2Class,
    );

    return this.renderContainer(`
      ${this.renderSlideImages(slide)}
      ${this.renderTitle(slide.text, titleClass)}
      <div class="button-section">
        ${this.renderButton("yes-btn", yesButtonClass, slide.button1)}
        ${this.renderButton("no-btn", noButtonClass, slide.button2)}
      </div>
    `);
  }
}

const slideRenderer = new SlideRenderer();

function loadSlide(slidePosition) {
  const slide = getSlide(slidePosition);
  if (!slidesRoot) {
    return;
  }

  if (activeSlide) {
    activeSlide.unmount();
  }

  slidesRoot.innerHTML = slideRenderer.render(slide);

  activeSlide = new SlideInteractionController(slide, slidesRoot, loadSlide);
  activeSlide.mount();
}

document.addEventListener("keydown", (event) => {
  if (!activeSlide) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key !== "n" && key !== "p") {
    return;
  }

  const targetTag = event.target?.tagName?.toLowerCase();
  if (
    targetTag === "input" ||
    targetTag === "textarea" ||
    targetTag === "select" ||
    event.target?.isContentEditable
  ) {
    return;
  }

  const currentPosition = activeSlide.slidePosition;
  const nextPosition = key === "n" ? currentPosition + 1 : currentPosition - 1;

  loadSlide(nextPosition);
});

renderBackgroundBubbles();
loadSlide(1);
