if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/audio_ctx",
        "odin/core/assets/asset"
    ],
    function(AudioCtx, Asset) {
        "use strict";


        var defineProperty = Object.defineProperty,
            fromCharCode = String.fromCharCode;


        function AudioClip(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Asset.extend(AudioClip);


        defineProperty(AudioClip.prototype, "length", {
            get: function() {
                return this.raw ? this.raw.duration : 0;
            }
        });


        defineProperty(AudioClip.prototype, "samples", {
            get: function() {
                return this.raw ? this.raw.length : 0;
            }
        });


        defineProperty(AudioClip.prototype, "frequency", {
            get: function() {
                return this.raw ? this.raw.sampleRate : 44100;
            }
        });


        defineProperty(AudioClip.prototype, "channels", {
            get: function() {
                return this.raw ? this.raw.numberOfChannels : 0;
            }
        });


        AudioClip.prototype.getData = function(array, offset) {
            array || (array = []);

            return this.raw ? this.raw.getChannelData(array, offset) : array;
        };


        AudioClip.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            if ((pack || !this.src) && this.raw) json.raw = arrayBufferToString(this.raw);

            return json;
        };


        AudioClip.prototype.fromServerJSON = function(json, pack) {
            Asset.prototype.fromServerJSON.call(this, json, pack);

            if ((pack || !this.src) && this.raw) this.raw = stringToArrayBuffer(json.raw);

            return this;
        };


        AudioClip.prototype.fromJSON = function(json, pack) {
            Asset.prototype.fromJSON.call(this, json, pack);

            if ((pack || !this.src) && this.raw) this.raw = stringToArrayBuffer(json.raw);

            return this;
        };


        function arrayBufferToString(arrayBuffer) {
            return fromCharCode.apply(null, new Uint16Array(arrayBuffer));
        }


        function stringToArrayBuffer(str) {
            var len = str.length,
                arrayBuffer = new ArrayBuffer(len * 2),
                array = new Uint16Array(arrayBuffer),
                i = len;

            for (; i--;) array[i] = str.charCodeAt(i);
            return arrayBuffer;
        }


        return AudioClip;
    }
);