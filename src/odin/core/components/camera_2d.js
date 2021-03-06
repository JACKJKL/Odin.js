if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf",
        "odin/math/color",
        "odin/math/vec2",
        "odin/math/mat32",
        "odin/math/mat4",
        "odin/core/components/component"
    ],
    function(Mathf, Color, Vec2, Mat32, Mat4, Component) {
        "use strict";


        var clamp = Mathf.clamp,
            EPSILON = Mathf.EPSILON;


        function Camera2D(opts) {
            opts || (opts = {});

            Component.call(this, "Camera2D", opts);

            this.width = 960;
            this.height = 640;
            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.autoResize = opts.autoResize != undefined ? !! opts.autoResize : true;
            this.background = opts.background != undefined ? opts.background : new Color(0.5, 0.5, 0.5);

            this.aspect = this.width / this.height;

            this.orthographicSize = opts.orthographicSize != undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize != undefined ? opts.minOrthographicSize : EPSILON;
            this.maxOrthographicSize = opts.maxOrthographicSize != undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat4;
            this._projection = new Mat32;
            this.guiProjection = new Mat4;

            this.view = new Mat4;
            this._view = new Mat32;

            this.needsUpdate = true;
            this._active = false;
        }

        Component.extend(Camera2D);


        Camera2D.prototype.copy = function(other) {

            this.width = other.width;
            this.height = other.height;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.autoResize = other.autoResize;
            this.background.copy(other.background);

            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this.needsUpdate = true;

            return this;
        };


        Camera2D.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.aspect = width / height;
            this.needsUpdate = true;
        };


        Camera2D.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;

            this.invWidth = 1 / this.width;

            this.needsUpdate = true;
        };


        Camera2D.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;

            this.invHeight = 1 / this.height;

            this.needsUpdate = true;
        };


        Camera2D.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this.needsUpdate = true;
        };


        var MAT32 = new Mat32,
            VEC2 = new Vec2;
        Camera2D.prototype.toWorld = function(v, out) {
            out || (out = new Vec2);

            out.x = 2 * (v.x * this.invWidth) - 1;
            out.y = -2 * (v.y * this.invHeight) + 1;
            out.transformMat32(MAT32.mmul(this._projection, this._view).inverse());

            return out;
        };


        Camera2D.prototype.toScreen = function(v, out) {
            out || (out = new Vec2);

            VEC2.copy(v).transformMat32(MAT32.mmul(this._projection, this._view));

            out.x = ((VEC2.x + 1) * 0.5) * this.width;
            out.y = ((1 - VEC2.y) * 0.5) * this.height;

            return out;
        };


        Camera2D.prototype.update = function() {
            if (!this._active) return;

            if (this.needsUpdate) {
                var orthographicSize = this.orthographicSize,
                    right = orthographicSize * this.aspect,
                    left = -right,
                    top = orthographicSize,
                    bottom = -top;

                this.projection.orthographic(left, right, top, bottom, -1, 1);
                this._projection.fromMat4(this.projection);
                this.needsUpdate = false;

                this.guiProjection.orthographic(0, this.width, 0, this.height, -1, 1);
            }

            this.view.inverseMat((this.transform || this.transform2d).matrixWorld);
            this._view.fromMat4(this.view);
        };


        Camera2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.width = this.width;
            json.height = this.height;

            json.autoResize = this.autoResize;
            json.background = this.background.toJSON(json.background);

            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;

            this.autoResize = json.autoResize;
            this.background.fromJSON(json.background);

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this.needsUpdate = true;

            return this;
        };


        return Camera2D;
    }
);
