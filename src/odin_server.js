if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function(require) {
        "use strict";


        var IS_SERVER = !(typeof(window) !== "undefined" && window.document),
            IS_CLIENT = !IS_SERVER,

            defineProperty = Object.defineProperty;


        function Odin() {

            this.Class = require("base/class");
            this.EventEmitter = require("base/event_emitter");
            this.Enum = require("base/enum");
            this.ObjectPool = require("base/object_pool");
            this.requestAnimationFrame = require("base/request_animation_frame");
            this.Time = require("base/time");
            this.util = require("base/util");

            this.Asset = require("core/assets/asset");
            this.Assets = require("core/assets/assets");
            this.AudioClip = require("core/assets/audio_clip");
            this.SpriteSheet = require("core/assets/sprite_sheet");
            this.Texture = require("core/assets/texture");

            this.AudioSource = require("core/components/audio_source");
            this.Camera = require("core/components/camera");
            this.Camera2D = require("core/components/camera_2d");
            this.Component = require("core/components/component");
            this.ParticleSystem = require("core/components/particle_system/particle_system");
            this.Sprite2D = require("core/components/sprite_2d");
            this.Transform = require("core/components/transform");
            this.Transform2D = require("core/components/transform_2d");

            this.Game = require("core/game/game");
            this.ServerGame = require("core/game/server_game");
            this.Config = require("core/game/config");
            this.Log = require("core/game/log");

            this.Input = require("core/input/input");

            this.Enums = require("core/enums");
            this.GameObject = require("core/game_object");
            this.Scene = require("core/scene");
            this.World = require("core/world");

            this.AABB2 = require("math/aabb2");
            this.AABB3 = require("math/aabb3");
            this.Color = require("math/color");
            this.Mat2 = require("math/mat2");
            this.Mat3 = require("math/mat3");
            this.Mat32 = require("math/mat32");
            this.Mat4 = require("math/mat4");
            this.Mathf = require("math/mathf");
            this.Quat = require("math/quat");
            this.Vec2 = require("math/vec2");
            this.Vec3 = require("math/vec3");
            this.Vec4 = require("math/vec4");
        }


        defineProperty(Odin.prototype, "isServer", {
            get: function() {
                return IS_SERVER;
            }
        });


        defineProperty(Odin.prototype, "isClient", {
            get: function() {
                return IS_CLIENT;
            }
        });


        Odin.prototype.globalize = function() {

            for (var key in this) global[key] = this[key];
            global.Odin = this;
        };


        return new Odin;
    }
);
