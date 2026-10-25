/**
 * Browser check for WebGL2, the graphics interface the 3D scene needs.
 *
 * Shared by the render-mode switch (full mode or fallback) and the playground
 * (Kálmán or an explanation). Runs in the browser only.
 */

/** Can this browser create a WebGL2 context? Some browsers throw instead of returning null. */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl === null) {
      return false;
    }
    // Release the test context right away: browsers allow only a few at a time.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
