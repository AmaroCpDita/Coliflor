// A subdivided sheet bends around a moving, diagonal cylinder. Unlike rotating
// a flat DOM element, every point on the photograph follows the paper's curve.
const VERTEX_SHADER = `
  attribute vec2 a_uv;
  uniform mediump vec2 u_size;
  uniform mediump vec2 u_normal;
  uniform mediump float u_crease;
  uniform mediump float u_radius;
  uniform mediump float u_direction;
  uniform mediump float u_sheet;
  varying mediump vec2 v_uv;
  varying mediump vec2 v_position;
  varying mediump float v_angle;
  varying mediump float v_height;

  void main() {
    vec2 point = a_uv * u_size;
    vec2 folded = point;
    float height = 0.0;
    float angle = 0.0;
    if (u_sheet > 0.5) {
      // Mirroring the geometry (not the photo) makes previous-page turns
      // start from the opposite corner with the same paper physics.
      point.x = u_direction > 0.0 ? point.x : u_size.x - point.x;
      float distance = max(0.0, dot(point, u_normal) - u_crease);
      angle = min(distance / u_radius, 3.14159265);
      float arc = u_radius * sin(angle);
      float tail = max(0.0, distance - 3.14159265 * u_radius);
      folded = point + u_normal * (arc - tail - distance);
      height = u_radius * (1.0 - cos(angle));
      folded.x = u_direction > 0.0 ? folded.x : u_size.x - folded.x;
    }
    // Perspective widens the raised edge, making the corner lift visible.
    float perspective = 1.0 / (1.0 - height / (u_size.x * 2.8));
    vec2 projected = (folded - u_size * 0.5) * perspective + u_size * 0.5;
    gl_Position = vec4(projected.x / u_size.x * 2.0 - 1.0,
                       1.0 - projected.y / u_size.y * 2.0,
                       0.5 - height / u_size.x, 1.0);
    v_uv = a_uv;
    v_position = point;
    v_angle = angle;
    v_height = height;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_photo;
  uniform vec2 u_size;
  uniform vec2 u_normal;
  uniform vec2 u_crop;
  uniform float u_crease;
  uniform float u_radius;
  uniform float u_direction;
  uniform float u_sheet;
  uniform float u_shadow;
  varying vec2 v_uv;
  varying vec2 v_position;
  varying float v_angle;
  varying float v_height;

  void main() {
    vec3 photo = texture2D(u_photo, (v_uv - 0.5) * u_crop + 0.5).rgb;
    if (u_sheet < 0.5) {
      vec2 point = v_position;
      point.x = u_direction > 0.0 ? point.x : u_size.x - point.x;
      float distance = dot(point, u_normal) - u_crease;
      // Contact shadow at the crease plus a softer shadow from the lifted leaf.
      float contact = exp(-pow(distance / (u_radius * 0.22), 2.0));
      float castShadow = exp(-pow((distance + u_radius * 0.7) / (u_radius * 1.25), 2.0));
      photo *= 1.0 - (0.27 * contact + 0.22 * castShadow) * u_shadow;
    } else {
      float bend = sin(v_angle);
      float light = 1.0 - 0.28 * bend;
      float shine = pow(max(0.0, cos(v_angle - 0.65)), 18.0) * bend;
      if (v_angle > 1.5707963) {
        // The reverse is warm paper with a faint image showing through,
        // naturally reflected by the folded geometry.
        vec3 paper = vec3(0.96, 0.94, 0.88);
        float grain = fract(sin(dot(v_uv * u_size, vec2(12.9898, 78.233))) * 43758.5453);
        photo = mix(paper, photo, 0.12) + (grain - 0.5) * 0.018;
        light = 0.87 + 0.13 * abs(cos(v_angle));
      }
      photo = photo * light + vec3(shine * 0.22);
      // A fine highlight gives the curling edge the thickness of a real leaf.
      float edge = 1.0 - smoothstep(0.0, 0.0025, min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y)));
      photo = mix(photo, vec3(0.98, 0.96, 0.90), edge * bend * 0.55);
    }
    gl_FragColor = vec4(photo, 1.0);
  }
`;

export interface PageCurlRenderer {
  draw: (progress: number) => void;
  dispose: () => void;
}

export function createPageCurl(
  canvas: HTMLCanvasElement,
  outgoing: HTMLImageElement,
  incoming: HTMLImageElement,
  direction: number,
): PageCurlRenderer | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
  if (!gl) return null;

  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  const buffers: WebGLBuffer[] = [];
  let program: WebGLProgram | null = null;
  const dispose = () => {
    textures.forEach((texture) => gl.deleteTexture(texture));
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
  };

  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to allocate page shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Page shader compilation failed');
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    program = gl.createProgram();
    if (!program) throw new Error('Unable to allocate page program');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error('Page shader link failed');
    gl.useProgram(program);

    const columns = 120;
    const rows = 60;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= columns; x++) vertices.push(x / columns, y / rows);
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const i = y * (columns + 1) + x;
        indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
      }
    }
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (!vertexBuffer || !indexBuffer) throw new Error('Unable to allocate page mesh');
    buffers.push(vertexBuffer, indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const uv = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);

    const upload = (image: HTMLImageElement) => {
      const texture = gl.createTexture();
      if (!texture) throw new Error('Unable to allocate page texture');
      textures.push(texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // Bound texture memory even when the album contains original phone photos.
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const bitmap = document.createElement('canvas');
      bitmap.width = Math.max(1, Math.round(image.naturalWidth * scale));
      bitmap.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = bitmap.getContext('2d');
      if (!context) throw new Error('Unable to prepare page texture');
      context.drawImage(image, 0, 0, bitmap.width, bitmap.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      return texture;
    };
    const front = upload(outgoing);
    const underneath = upload(incoming);
    const uniforms = Object.fromEntries(
      ['size', 'normal', 'crease', 'radius', 'direction', 'sheet', 'shadow', 'crop', 'photo'].map(
        (name) => [name, gl.getUniformLocation(program!, `u_${name}`)],
      ),
    );
    gl.uniform1i(uniforms.photo, 0);
    gl.uniform1f(uniforms.direction, direction);
    gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const draw = (progress: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height || gl.isContextLost()) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.05, 0.05, 0.07, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // A gently diagonal crease lifts the lower outer corner first. The radius
      // grows as the page is picked up, then relaxes as it leaves the frame.
      const normalX = 0.975;
      const normalY = 0.222;
      const radius = width * (0.045 + 0.065 * Math.sin(Math.PI * progress));
      const maximum = width * normalX + height * normalY;
      const crease = maximum - progress * (maximum + width * 0.38);
      gl.uniform2f(uniforms.size, width, height);
      gl.uniform2f(uniforms.normal, normalX, normalY);
      gl.uniform1f(uniforms.crease, crease);
      gl.uniform1f(uniforms.radius, radius);
      gl.uniform1f(uniforms.shadow, Math.sin(Math.PI * progress));

      const drawSheet = (texture: WebGLTexture, image: HTMLImageElement, sheet: number) => {
        const aspect = width / height;
        const imageAspect = image.naturalWidth / image.naturalHeight;
        gl.uniform2f(
          uniforms.crop,
          Math.min(1, aspect / imageAspect),
          Math.min(1, imageAspect / aspect),
        );
        gl.uniform1f(uniforms.sheet, sheet);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      };
      drawSheet(underneath, incoming, 0);
      drawSheet(front, outgoing, 1);
    };
    return { draw, dispose };
  } catch {
    // WebGL or CORS restrictions must never prevent the album from advancing.
    dispose();
    return null;
  }
}
