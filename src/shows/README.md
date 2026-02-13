# Slide Schema

Example (full object):
```javascript
    {
    position: 3,                      // Required, unique slide order
    template: "two_buttons",          // Required: "one_button" | "two_buttons"
    text: "Will you be my Valentine?",// Required text/html content
    img: "assets/please.gif",         // Optional string OR array of image paths
    imgClass: "story-image",          // Optional class for single image
    button1: "Yes 💖",                // Optional label for first button
    button2: "No 🙃",                 // Optional label for second button
    config: {
        targetButton1: "next",          // Optional: "next" | "last" | <number>
        targetButton2: "moving_button", // Optional: "moving_button" | "next" | "last" | <number>
        no_messages: ["nope", "again"], // Optional: rotating text for moving button
        titleClass: "emoji-title",      // Optional extra class for title <p>
        button1Class: "emoji-btn",      // Optional extra class for button1
        button2Class: "custom-no-btn",  // Optional extra class for button2
    }
    }
```
Defaults:
- `targetButton1`: "next" (one_button and two_buttons)
- `targetButton2`: "moving_button" (two_buttons)
- `no_messages`: `DEFAULT_NO_MESSAGES` when missing/empty
