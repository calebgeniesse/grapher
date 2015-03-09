(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];

    fn.call(m.exports, function(req){
      var dep = modules[id][1][req];
      return require(dep ? dep : req);
    }, m, m.exports, outer, modules, cache, entries);

    // expose as `name`.
    if (name) cache[name] = cache[id];

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {

var LinkVertexShaderSource = require('./shaders/link.vert'),
    LinkFragmentShaderSource = require('./shaders/link.frag'),
    NodeVertexShaderSource = require('./shaders/node.vert'),
    NodeFragmentShaderSource = require('./shaders/node.frag');

Renderer = function () {
  this.initialize.apply(this, arguments);
  return this;
};

Renderer.prototype = {};

Renderer.prototype.initialize = function (o) {
  this.props = {};
  this.props.canvas = o.canvas;
  this.props.width = o.width; // using canvas.width instead
  this.props.height = o.height; // using canvas.height instead
  this.props.linkWidth = o.linkWidth || 2;
  this.props.backgroundColor = o.backgroundColor || 16779765; //float(255,255,255); //not used anywhere

  this.nodeObjects = [];
  this.linkObjects = [];

  this.nodes = [];
  this.links = [];

  //initial transform position 
  this.scale = 1;
  this.translate = [0, 0];

  this.NODE_ATTRIBUTES = 6;
  this.LINKS_ATTRIBUTES = 3;

  this.nodeVertexShaderSource = NodeVertexShaderSource;
  this.nodeFragmentShaderSource = NodeFragmentShaderSource;
  this.linkVertexShaderSource = LinkVertexShaderSource;
  this.linkFragmentShaderSource = LinkFragmentShaderSource;

};

Renderer.prototype.setNodes = function (nodes) { this.nodeObjects = nodes; };

Renderer.prototype.setLinks = function (links) { this.linkObjects = links; };

Renderer.prototype.render = function () {
  this.initGL();
  this.updateNodesBuffer();
  this.updateLinksBuffer();
  this.renderLinks(); // links have to be rendered first because of blending;
  this.renderNodes();
};

Renderer.prototype.setScale = function (scale) { this.scale = scale; };

Renderer.prototype.setTranslate = function (translate) { this.translate = translate; };

Renderer.prototype.updateNodesBuffer = function () {
  var j = 0;
  this.nodes = [];
  for (var i = 0; i < this.nodeObjects.length; i++) {
    var cx = this.nodeObjects[i].x * this.scale + this.translate[0] ;
    var cy = this.nodeObjects[i].y * this.scale + this.translate[1];
    var r = this.nodeObjects[i].r * this.scale;
    var color = this.nodeObjects[i].color;


    this.nodes[j++] = (cx - r);
    this.nodes[j++] = (cy - r);
    this.nodes[j++] = color;
    this.nodes[j++] = cx;
    this.nodes[j++] = cy;
    this.nodes[j++] = r;

    this.nodes[j++] = (cx + (1 + Math.sqrt(2))*r);
    this.nodes[j++] = cy - r;
    this.nodes[j++] = color;
    this.nodes[j++] = cx;
    this.nodes[j++] = cy;
    this.nodes[j++] = r;

    this.nodes[j++] = (cx - r);
    this.nodes[j++] = (cy + (1 + Math.sqrt(2))*r);
    this.nodes[j++] = color;
    this.nodes[j++] = cx;
    this.nodes[j++] = cy;
    this.nodes[j++] = r;
  }
};

Renderer.prototype.updateLinksBuffer = function () {
  var j = 0;
  this.links = [];
  for (var i = 0; i < this.linkObjects.length; i++) {
    var x1 = this.linkObjects[i].x1 * this.scale + this.translate[0];
    var y1 = this.linkObjects[i].y1 * this.scale + this.translate[1];
    var x2 = this.linkObjects[i].x2 * this.scale + this.translate[0];
    var y2 = this.linkObjects[i].y2 * this.scale + this.translate[1];
    var color = this.linkObjects[i].color;

    this.links[j++] = x1;
    this.links[j++] = y1;
    this.links[j++] = color;

    this.links[j++] = x2;
    this.links[j++] = y2;
    this.links[j++] = color;
  }
};

Renderer.prototype.getTransformedPosition = function (position) {
 return [position.x / this.scale - this.translate[0], position.y / this.scale - this.translate[1]];
};

Renderer.prototype.initGL = function () {
   if (typeof gl === 'undefined') gl = this.props.canvas.getContext('experimental-webgl', {antialias: true});
  gl.viewport(0, 0, canvas.width, canvas.height); // this may be default...
};

Renderer.prototype.initShaders = function (vertexShaderSource, fragmentShaderSource) {
  var vertexShader = this.getShaders.apply(this, [gl.VERTEX_SHADER, vertexShaderSource]);
  var fragmentShader = this.getShaders.apply(this, [gl.FRAGMENT_SHADER, fragmentShaderSource]);
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  gl.lineWidth(this.props.linkWidth * this.scale); // this is only for links
  return shaderProgram;
};

Renderer.prototype.getShaders = function (type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

Renderer.prototype.renderLinks = function () {
  var program = this.initShaders.apply(this, [this.linkVertexShaderSource, this.linkFragmentShaderSource]);
  var linksBuffer = new Float32Array(this.links);
  var buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, linksBuffer, gl.STATIC_DRAW);

  var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  var positionLocation = gl.getAttribLocation(program, 'a_position');
  var colorLocation = gl.getAttribLocation(program, 'a_color');
  
  gl.enableVertexAttribArray(positionLocation);
  gl.enableVertexAttribArray(colorLocation);

  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.vertexAttribPointer(colorLocation, 1, gl.FLOAT, false, this.LINKS_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

  gl.drawArrays(gl.LINES, 0, this.links.length/this.LINKS_ATTRIBUTES);
};

Renderer.prototype.renderNodes = function () {
  var program = this.initShaders.apply(this, [this.nodeVertexShaderSource, this.nodeFragmentShaderSource]);
  var nodesBuffer = new Float32Array(this.nodes);
  var buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, nodesBuffer, gl.STATIC_DRAW);

  var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

  var positionLocation = gl.getAttribLocation(program, 'a_position');
  var colorLocation = gl.getAttribLocation(program, 'a_color');
  var centerLocation = gl.getAttribLocation(program, 'a_center');
  var radiusLocation = gl.getAttribLocation(program, 'a_radius');

  
  gl.enableVertexAttribArray(positionLocation);
  gl.enableVertexAttribArray(colorLocation);
  gl.enableVertexAttribArray(centerLocation);
  gl.enableVertexAttribArray(radiusLocation);

  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.vertexAttribPointer(colorLocation, 1, gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);
  gl.vertexAttribPointer(centerLocation, 2, gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 12);
  gl.vertexAttribPointer(radiusLocation, 1, gl.FLOAT, false, this.NODE_ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 20);

  gl.drawArrays(gl.TRIANGLES, 0, this.nodes.length/this.NODE_ATTRIBUTES);
};

}, {"./shaders/link.vert":2,"./shaders/link.frag":3,"./shaders/node.vert":4,"./shaders/node.frag":5}],
2: [function(require, module, exports) {
module.exports = 'uniform vec2 u_resolution;\nattribute vec2 a_position;\nattribute float a_color;\nvarying vec4 color;\nvarying vec2 position;\nvarying vec2 resolution;\nvoid main() {\n  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;\n  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);\n  float c = a_color;\n  color.b = mod(c, 256.0); c = floor(c / 256.0);\n  color.g = mod(c, 256.0); c = floor(c / 256.0);\n  color.r = mod(c, 256.0); c = floor(c / 256.0); color /= 255.0;\n  color.a = 1.0;\n}\n';
}, {}],
3: [function(require, module, exports) {
module.exports = 'precision mediump float;\nvarying vec4 color;\nvoid main() {\n  gl_FragColor = color;\n}\n';
}, {}],
4: [function(require, module, exports) {
module.exports = 'uniform vec2 u_resolution;\nattribute vec2 a_position;\nattribute float a_color;\nattribute vec2 a_center;\nattribute float a_radius;\nvarying vec4 color;\nvarying vec2 center;\nvarying vec2 resolution;\nvarying float radius;\nvoid main() {\n  vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;\n  gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);\n  float c = a_color;\n  color.b = mod(c, 256.0); c = floor(c / 256.0);\n  color.g = mod(c, 256.0); c = floor(c / 256.0);\n  color.r = mod(c, 256.0); c = floor(c / 256.0); color /= 255.0;\n  color.a = 1.0;\n  radius = a_radius;\n  center = a_center;\n  resolution = u_resolution;\n}\n';
}, {}],
5: [function(require, module, exports) {
module.exports = 'precision mediump float;\nvarying vec4 color;\nvarying vec2 center;\nvarying vec2 resolution;\nvarying float radius;\nvoid main() {\n  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);\n  float x = gl_FragCoord.x;\n  float y = resolution[1] - gl_FragCoord.y;\n  float dx = center[0] - x;\n  float dy = center[1] - y;\n  float distance = sqrt(dx*dx + dy*dy);\n  if ( distance < radius )\n    gl_FragColor = color;\n  else \n    gl_FragColor = color0;\n}\n';
}, {}]}, {}, {"1":""})
