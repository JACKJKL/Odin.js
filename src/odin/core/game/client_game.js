define([
        "odin/base/class",
        "odin/base/device",
        "odin/base/time",
        "odin/core/game/config",
        "odin/core/game/game",
        "odin/core/game/loop",
        "odin/core/rendering/canvas",
        "odin/core/rendering/canvas_renderer_2d",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler"
    ],
    function(Class, Device, Time, Config, Game, Loop, Canvas, CanvasRenderer2D, GameObject, Component, Scene, Input, Handler) {
        "use strict";


        var now = Time.now,
            stamp = Time.stamp;


        function ClientGame(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            Game.call(this, opts);

            this._loop = new Loop(loop, this);

            this.io = undefined;
			this._sessionid = undefined;

            this._handler = Handler;
            this.input = Input;

            this.scene = undefined;
            this.camera = undefined;

            this.canvas = new Canvas(opts.width, opts.height);
            this.renderer = undefined;
        }
		
        Class.extend(ClientGame, Game);


        ClientGame.prototype.init = function() {
            this.canvas.init();
			
            this._loop.resume();
            this.emit("init");
			
            return this;
        };


        ClientGame.prototype.connect = function() {
            var self = this,
                socket;

            this.io = socket = io.connect();

            socket.on("connect", function() {
				if (!self._sessionid) self._sessionid = this.socket.sessionid;
				if (self._sessionid !== this.socket.sessionid) location.reload();
				
                socket.emit("client_device", Device);
            });

            socket.on("server_ready", function(game) {
                self.fromJSON(game);
                socket.emit("client_ready");

                self.emit("connect", socket);
            });

            socket.on("server_sync_input", function() {
				
                socket.emit("client_sync_input", Input.toSYNC());
            });
			
            socket.on("server_sync_scene", function(jsonScene) {
				var scene = self.scene;
				
				if (!scene) return;
				scene.fromSYNC(jsonScene);
            });

            socket.on("server_setScene", function(scene_id) {
                var scene = self.findByServerId(scene_id);

                self.setScene(scene);
            });

            socket.on("server_setCamera", function(camera_id) {
                if (!self.scene) {
                    console.warn("Socket server_setCamera: can't set camera without an active scene, use ServerGame.setScene first");
                    return;
                }
                var camera = self.scene.findByServerId(camera_id),
                    canvas = self.canvas;

                if (!camera) {
                    console.warn("Socket server_setCamera: can't find camera in active scene");
                    return;
                }
                self.setCamera(camera);

                canvas.on("resize", function() {

                    socket.emit("client_resize", this.pixelWidth, this.pixelHeight);
                });
                socket.emit("client_resize", canvas.pixelWidth, canvas.pixelHeight);
            });

            socket.on("server_addScene", function(scene) {

                self.addScene(new Scene().fromJSON(scene));
            });

            socket.on("server_addGameObject", function(scene_id, gameObject) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.addGameObject(new GameObject().fromJSON(gameObject));
            });

            socket.on("server_addComponent", function(scene_id, gameObject_id, component) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;

                gameObject.addComponent(new Component._types[component._type].fromJSON(component));
            });


            socket.on("server_removeScene", function(scene_id) {

                self.removeScene(self.findByServerId(scene_id));
            });

            socket.on("server_removeGameObject", function(scene_id, gameObject_id) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.removeGameObject(scene.findByServerId(gameObject_id));
            });

            socket.on("server_removeComponent", function(scene_id, gameObject_id, componentType) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;

                gameObject.removeComponent(gameObject.get(componentType));
            });

            return this;
        };


        ClientGame.prototype.suspend = function() {

            this._loop.suspend();
            return this;
        };


        ClientGame.prototype.resume = function() {

            this._loop.resume();
            return this;
        };


        ClientGame.prototype.setScene = function(scene) {
            if (!(scene instanceof Scene)) {
                console.warn("ClientGame.setScene: can't add passed argument, it is not instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {
                this.scene = scene;
            } else {
                console.warn("ClientGame.setScene: Scene is not a member of Game");
            }

            return this;
        };


        ClientGame.prototype.setCamera = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                console.warn("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
                return this;
            }
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                console.warn("ClientGame.setCamera: can't set camera without an active scene, use ClientGame.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                console.warn("ClientGame.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;

                this.updateRenderer();
            } else {
                console.warn("ClientGame.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        ClientGame.prototype.updateRenderer = function() {
            var camera = this.camera,
                lastRenderer = this.renderer,
				canvas = this.canvas,
                gameObject;
			
            if (!camera) return;
            gameObject = camera.gameObject;

            if (gameObject.camera) {

            } else if (gameObject.camera2d) {
                if (!Config.forceCanvas && Device.webgl) {
                    this.renderer = CanvasRenderer2D;
                    console.log("Game.updateRenderer: setting up WebGLRenderer2D");
                } else if (Device.canvas) {
                    this.renderer = CanvasRenderer2D;
                    console.log("Game.updateRenderer: setting up CanvasRenderer2D");
                } else {
                    throw new Error("Game.updateRenderer: Could not get a renderer for this device");
                }
            }

            if (lastRenderer === this.renderer) return;
            if (lastRenderer) lastRenderer.destroy();
			
			this.renderer.init(canvas);
            Handler.setElement(canvas.element);
        };


        var frameCount = 0,
            last = -1 / 60,
            time = 0,
            delta = 1 / 60,
            fpsFrame = 0,
            fpsLast = 0,
            fpsTime = 0;

        function loop(ms) {
            var camera = this.camera,
                scene = this.scene,
                gameObjects,
				MIN_DELTA = Config.MIN_DELTA,
				MAX_DELTA = Config.MAX_DELTA,
                i;

            Time.frameCount = frameCount++;

            last = time;
            time = now();
            Time.sinceStart = time;

            fpsTime = time;
            fpsFrame++;

            if (fpsLast + 1 < fpsTime) {
                Time.fps = fpsFrame / (fpsTime - fpsLast);

                fpsLast = fpsTime;
                fpsFrame = 0;
            }

            delta = (time - last) * Time.scale;
            Time.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

            Time.time = time * Time.scale;

            Input.update();

            if (scene) {
                scene.update();
                if (camera) this.renderer.render(scene, camera);
            }

            this.emit("update", time);
        }


        return ClientGame;
    }
);
