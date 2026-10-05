// Tells the scripts of the page whether the scenes can show. A scene needs WebGL.
// The scene script and the motion script start in an order that the page does not fix, so each one asks here.

// The styles read this attribute on the root element.
const ATTRIBUTE = "data-scenes";
const OFF = "off";

let supported: boolean | undefined;

/** Tries to get a WebGL context, and gives it back at once: a page can hold only some contexts at a time. */
function probe(): boolean {
  const gl = document.createElement("canvas").getContext("webgl");
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return gl !== null;
}

/** Tells whether the browser can draw the scenes. When it cannot, the first call marks the root element for the styles. */
export function supportsScenes(): boolean {
  if (supported === undefined) {
    supported = probe();
    if (!supported) document.documentElement.setAttribute(ATTRIBUTE, OFF);
  }
  return supported;
}
