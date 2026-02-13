import { OVERLAP_PADDING, VIEWPORT_MARGIN } from "./constants.js";

export const DEFAULT_NO_MESSAGES = [
  "Wrong button",
  "Are you sure?",
  "You're breaking my heart 💔",
  "You can't catch me",
  "Amoooor! porqué no!? 😡",
  "I knew it! You have a sidechick! 😭",
  "No massages! Ever again 😤",
  "I thought you love me 🥺",
];

function getRequestedShowName() {
  if (typeof window === "undefined") {
    return "default";
  }

  const show = new URLSearchParams(window.location.search).get("show");
  const normalizedShow = show?.trim().toLowerCase();

  if (!normalizedShow) {
    return "default";
  }

  if (!/^[a-z0-9_-]+$/.test(normalizedShow)) {
    return "default";
  }

  return normalizedShow;
}

async function loadShowSlides(showName) {
  if (showName !== "default") {
    try {
      const showModule = await import(`./shows/${showName}.js`);
      return showModule.slides;
    } catch (error) {
      // Fall through to default show.
    }
  }

  try {
    const defaultShowModule = await import("./shows/default.js");
    return defaultShowModule.slides;
  } catch (error) {
    const noShowModule = await import("./shows/no_show.js");
    return noShowModule.slides;
  }
}

const selectedShowName = getRequestedShowName();
const slides = await loadShowSlides(selectedShowName);
const slidesByPosition = new Map(slides.map((slide) => [slide.position, slide]));
const lastSlidePosition = Math.max(...slides.map((slide) => slide.position));

const TARGET_RESOLVERS = {
  next: (position) => position + 1,
  last: () => lastSlidePosition,
};

function lockButtonPosition(button) {
  button.style.transition = "none";
  const rect = button.getBoundingClientRect();
  button.style.position = "fixed";
  button.style.left = `${rect.left}px`;
  button.style.top = `${rect.top}px`;
  button.style.transform = "none";
  button.style.zIndex = "3";
  void button.offsetWidth;
  button.style.transition = "";
}

function createAvoidCollisionPositionFinder(button, getForbiddenElements) {
  const randomInRange = (min, max) => min + Math.random() * (max - min);
  const distanceSquared = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
  };
  const intersectsForbidden = (left, top, width, height, forbiddenRects) =>
    forbiddenRects.some(
      (rect) =>
        left < rect.right + OVERLAP_PADDING &&
        left + width > rect.left - OVERLAP_PADDING &&
        top < rect.bottom + OVERLAP_PADDING &&
        top + height > rect.top - OVERLAP_PADDING,
    );

  return () => {
    const btnRect = button.getBoundingClientRect();
    const width = btnRect.width;
    const height = btnRect.height;
    const minX = VIEWPORT_MARGIN;
    const minY = VIEWPORT_MARGIN;
    const maxX = Math.max(minX, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxY = Math.max(minY, window.innerHeight - height - VIEWPORT_MARGIN);
    const currentX = btnRect.left;
    const currentY = btnRect.top;
    const availableVerticalSpace = Math.max(0, maxY - minY);
    const minViewportSide = Math.min(window.innerWidth, window.innerHeight);
    const minJumpDistance = Math.min(Math.max(120, minViewportSide * 0.2), minViewportSide * 0.55);
    const minJumpDistanceSquared = minJumpDistance * minJumpDistance;
    const minVerticalJump = availableVerticalSpace * 0.5;
    const forbiddenRects = getForbiddenElements()
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);

    for (let i = 0; i < 120; i += 1) {
      const candidateX = randomInRange(minX, maxX);
      const candidateY = randomInRange(minY, maxY);

      const isFarEnough =
        distanceSquared(candidateX, candidateY, currentX, currentY) >= minJumpDistanceSquared;
      const isVerticalFarEnough = Math.abs(candidateY - currentY) >= minVerticalJump;
      if (
        isFarEnough &&
        isVerticalFarEnough &&
        !intersectsForbidden(candidateX, candidateY, width, height, forbiddenRects)
      ) {
        return { x: candidateX, y: candidateY };
      }
    }

    for (let y = minY; y <= maxY; y += 24) {
      for (let x = minX; x <= maxX; x += 24) {
        const isFarEnough = distanceSquared(x, y, currentX, currentY) >= minJumpDistanceSquared;
        const isVerticalFarEnough = Math.abs(y - currentY) >= minVerticalJump;
        if (isFarEnough && isVerticalFarEnough && !intersectsForbidden(x, y, width, height, forbiddenRects)) {
          return { x, y };
        }
      }
    }

    for (let y = minY; y <= maxY; y += 24) {
      for (let x = minX; x <= maxX; x += 24) {
        if (!intersectsForbidden(x, y, width, height, forbiddenRects)) {
          return { x, y };
        }
      }
    }

    return {
      x: randomInRange(minX, maxX),
      y: randomInRange(minY, maxY),
    };
  };
}

export function getSlide(position) {
  return slidesByPosition.get(position);
}

export function getLastSlidePosition() {
  return lastSlidePosition;
}

export class SlideInteractionController {
  constructor(slide, root, onSlideChange) {
    this.slide = slide;
    this.slidePosition = slide.position;
    this.root = root;
    this.onSlideChange = onSlideChange;
    this.cleanupCallbacks = [];
  }

  get config() {
    return this.slide.config ?? {};
  }

  resolveTarget(target, fallback = "next") {
    const resolvedTarget = target ?? fallback;

    if (typeof resolvedTarget === "number") {
      return resolvedTarget;
    }

    const resolver = TARGET_RESOLVERS[resolvedTarget];
    if (!resolver) {
      return this.slide.position + 1;
    }

    return resolver(this.slide.position);
  }

  navigateTo(target, fallback = "next") {
    const nextPosition = this.resolveTarget(target, fallback);
    this.onSlideChange(nextPosition);
  }

  addCleanup(fn) {
    this.cleanupCallbacks.push(fn);
  }

  getElement(selector) {
    return this.root.querySelector(selector);
  }

  bindButton(selector, handler) {
    const button = this.getElement(selector);
    if (!button) {
      return null;
    }

    button.addEventListener("click", handler);
    this.addCleanup(() => button.removeEventListener("click", handler));
    return button;
  }

  bindNavigationButton(selector, target, fallback = "next") {
    return this.bindButton(selector, (event) => {
      event.preventDefault();
      this.navigateTo(target, fallback);
    });
  }

  mountOneButton() {
    if (!this.slide.button1) {
      return;
    }

    const targetButton1 = this.config.targetButton1 ?? "next";
    this.bindNavigationButton("#next-btn", targetButton1);
  }

  mountTwoButtons() {
    const button1 = this.getElement("#yes-btn");
    const button2 = this.getElement("#no-btn");

    if (!button1) {
      this.mountOneButton();
      return;
    }

    this.setupYesButton(button1);
    this.setupNoButton(button1, button2);
  }

  setupYesButton(button1) {
    const targetButton1 = this.config.targetButton1 ?? "next";
    this.bindNavigationButton("#yes-btn", targetButton1);
  }

  setupNoButton(button1, button2) {
    if (!button2) {
      return;
    }

    const targetButton2 = this.config.targetButton2 ?? "moving_button";

    if (targetButton2 !== "moving_button") {
      this.setupStandardNoButton(targetButton2);
      return;
    }

    this.setupMovingNoButton(button1, button2);
  }

  setupMovingNoButton(button1, button2) {
    let isLocked = false;
    const lockInViewport = () => {
      if (isLocked) {
        return;
      }
      lockButtonPosition(button2);
      isLocked = true;
    };

    let secondFrameId = null;
    const firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(lockInViewport);
    });
    this.addCleanup(() => cancelAnimationFrame(firstFrameId));
    this.addCleanup(() => {
      if (secondFrameId !== null) {
        cancelAnimationFrame(secondFrameId);
      }
    });

    const image = this.getElement("#slide-image");
    if (image && !image.complete) {
      image.addEventListener("load", lockInViewport, { once: true });
      this.addCleanup(() => image.removeEventListener("load", lockInViewport));
    }

    const noMessages =
      Array.isArray(this.config.no_messages) && this.config.no_messages.length > 0
        ? this.config.no_messages
        : DEFAULT_NO_MESSAGES;
    const findSafePosition = createAvoidCollisionPositionFinder(button2, () => [button1]);
    const title = this.getElement(".title");
    let dodgeCount = 0;
    let dodgeLevel = 0;

    const getDodgeLevel = (count) => {
      if (count >= 35) {
        return 35;
      }

      if (count >= 30) {
        return 30;
      }

      if (count >= 25) {
        return 25;
      }

      if (count >= 20) {
        return 20;
      }

      if (count >= 15) {
        return 15;
      }

      if (count >= 10) {
        return 10;
      }

      if (count >= 5) {
        return 5;
      }

      return 0;
    };

    const applyDodgeLevel = (level) => {
      if (level === dodgeLevel) {
        return;
      }

      dodgeLevel = level;

      if (level >= 5) {
        button1.classList.add("yes-dodge-5");
        if (title) {
          title.innerHTML = "That's the wrong button 😅";
        }
      }

      if (level >= 10) {
        button1.classList.add("yes-dodge-10");
        if (title) {
          title.innerHTML = "El boton esta qui!<br /><strong>↓</strong>";
        }
        if (image) {
          image.src = "assets/button_here.gif";
        }
      }

      if (level >= 15) {
        if (title) {
          title.innerHTML = "What the fuck are you doing!?";
        }
        if (image) {
          image.src = "assets/wtf.gif";
        }
      }

      if (level >= 20) {
        if (title) {
          title.innerHTML = "This is not funny anymore";
        }
        if (image) {
          image.src = "assets/sad_ground.gif";
        }
      }

      if (level >= 25) {
        if (title) {
          title.innerHTML = "I thought you love me";
        }
        if (image) {
          image.src = "assets/broken_heart.gif";
        }
      }

      if (level >= 30) {
        if (title) {
          title.innerHTML = "Stop This now! you will be mine for EVER.";
        }
        if (image) {
          image.src = "assets/angry.gif";
        }
      }

      if (level >= 35) {
        if (title) {
          title.innerHTML = "APRETA... EL... BOTON...";
        }
        if (image) {
          image.src = "assets/kill.gif";
        }
      }
    };

    let phraseIndex = 0;
    const moveButton = () => {
      lockInViewport();

      if (noMessages.length > 0) {
        phraseIndex = (phraseIndex + 1) % noMessages.length;
        button2.innerHTML = noMessages[phraseIndex];
      }

      const nextPosition = findSafePosition();
      button2.style.left = `${nextPosition.x}px`;
      button2.style.top = `${nextPosition.y}px`;
    };

    const onPointerEnter = () => {
      dodgeCount += 1;
      applyDodgeLevel(getDodgeLevel(dodgeCount));

      if (dodgeLevel >= 35) {
        button2.removeEventListener("pointerenter", onPointerEnter);
        button2.remove();
        return;
      }

      moveButton();
    };

    const onFirstClick = (event) => {
      event.preventDefault();
      moveButton();

      button2.removeEventListener("click", onFirstClick);
      button2.addEventListener("pointerenter", onPointerEnter);
    };

    button2.addEventListener("click", onFirstClick);
    this.addCleanup(() => button2.removeEventListener("click", onFirstClick));
    this.addCleanup(() => button2.removeEventListener("pointerenter", onPointerEnter));
  }

  setupStandardNoButton(targetButton2) {
    this.bindNavigationButton("#no-btn", targetButton2);
  }

  mount() {
    if (this.slide.template !== "two_buttons") {
      this.mountOneButton();
      return;
    }

    this.mountTwoButtons();
  }

  unmount() {
    this.cleanupCallbacks.forEach((fn) => fn());
    this.cleanupCallbacks = [];
  }
}
