!function($){
  
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  //
  // SpriteSheet
  //
  //////////////////////////////////////////////////////////////////////////////
  
  function SpriteSheet(url, frames) {
    this.url = url;
    this.frames = frames;
    this.initFrames();
    this.load();
  }
  
  SpriteSheet.prototype.initFrames = function() {
    for (var id in this.frames) {
      var f = this.frames[id];
      f.xoff = f.xoff || 0;
      f.yoff = f.yoff || 0;
    }
  };
  
  SpriteSheet.prototype.load = function() {
    var that = this;
    var $deferred = $.Deferred();
    var image = new Image();
    image.onload = function(){
      $deferred.resolve();
    };
    image.onerror = function(){
      $deferred.fail();
    };
    image.src = this.url;
    this.image = image;
    this.$deferred = $deferred;
  };
  
  SpriteSheet.prototype.renderFrame = function(id, canvas, x, y) {
    var frame = this.frames[id];
    if (frame) {
      var context = canvas.getContext('2d');
      context.drawImage(
        this.image, 
        frame.x, frame.y, frame.w, frame.h, 
        x+frame.xoff, y+frame.yoff, frame.w, frame.h
      );
    }
  }
  
  //////////////////////////////////////////////////////////////////////////////
  //
  // Sprite
  //
  //////////////////////////////////////////////////////////////////////////////
  
  function Sprite(spriteSheet, animations, world){
    this.x = 0;
    this.y = 0;
    this.spriteSheet = spriteSheet;
    this.animations = animations;
    this.world = world;
    this.initAnimations();
  }

  Sprite.prototype.initAnimations = function() {
    for (var id in this.animations) {
      var steps = this.animations[id];
      var time = 0;
      for (var i=0; i<steps.length; i++) {
        var step = steps[i];
        var ms = step.time * 1000;
        step.timeStart = time;
        step.timeEnd = time + ms - 1;
        step.x = step.x || 0;
        step.y = step.y || 0;
        time += ms;
      }
    }
  };
  
  Sprite.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };

  Sprite.prototype.playAnimation = function(id) {
    this.currentAnimation = {
        id: id,
        steps: this.animations[id],
        startTime: +new Date()
    }
  };
  
  Sprite.prototype.getCurrentAnimationStep = function() {
    var currAnim = this.currentAnimation;
    var now = +new Date();
    var diff = now - currAnim.startTime;
    for (var i=0; i<currAnim.steps.length; i++) {
      var step = currAnim.steps[i];
      if (diff>=step.timeStart && diff <=step.timeEnd) {
        return step;
      }
    }
  };

  Sprite.prototype.update = function() {
    // To be overridden
    this.this.currentAnimationStep = this.getCurrentAnimationStep();
  };

  Sprite.prototype.render = function(canvas) {
    if (this.currentAnimationStep) {
      this.spriteSheet.renderFrame(this.currentAnimationStep.frame, canvas, this.x, this.y);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  // Dude
  //
  //////////////////////////////////////////////////////////////////////////////

  function Dude() {
    Sprite.apply(this, arguments);
  }
  
  Dude.prototype = new Sprite();
  
  Dude.prototype.constructor = Dude;
  
  Dude.prototype.interrupt = function() {
    this.playAnimation('angry');
  };

  Dude.prototype.update = function() {
    
    var random;

    this.currentAnimationStep = this.getCurrentAnimationStep();

    if (!this.currentAnimationStep) {

      switch (this.currentAnimation.id) {
        
        case 'blink':
          this.playAnimation('stand');
          break;
          
        case 'stand':
          random = Math.random() * 100;
          if (random<20) {
            this.playAnimation('blink');
          }
          else if (random<40) {
            this.playAnimation('happy');
          }
          else if (random<60) {
            this.playAnimation('angry');
          }
          else if (random<80) {
            this.playAnimation('left');
          }
          else {
            this.playAnimation('right');
          }
          break;
          
        case 'angry':
          this.playAnimation('stand');
          break;
          
        case 'happy':
          this.playAnimation('stand');
          break;
          
        case 'left':
          random = Math.random() * 100;
          if (random<80) {
            this.playAnimation('left');
          }
          else {
            this.playAnimation('stand');
          }
          break;
          
        case 'right':
          random = Math.random() * 100;
          if (random<80) {
            this.playAnimation('right');
          }
          else {
            this.playAnimation('stand');
          }
          break;
          
        default:
          this.playAnimation('stand');
          break;
          
      }

      this.currentAnimationStep = this.getCurrentAnimationStep();

    }
    
    if (this.currentAnimationStep !== this.lastAnimationStep) {
 
      this.x = this.x + this.currentAnimationStep.x;
      this.y = this.y + this.currentAnimationStep.y;
      
      if (this.x<-50) {
        this.x = this.world.width;
      }
      else if (this.x>this.world.width) {
        this.x = -50;
      }
      
      this.lastAnimationStep = this.currentAnimationStep;
      
    }

  };


  
  //////////////////////////////////////////////////////////////////////////////
  //
  // App
  //
  //////////////////////////////////////////////////////////////////////////////
  
  var App = {
      
    start: function($container) {
      var that = this;
      this.$container = $container;
      var $deferred = this.initSprites();
      $deferred.done(function(){
        that.initCanvas();
        that.initSprites();
        that.initAnimation();
        that.initClickHandler();
      });
    },
    
    initSprites: function() {
      
      var frames = {
        angry1: { x:0, y:0, w:53, h:119, xoff:2, yoff:4  },
        angry2: { x:53, y:0, w:51, h:119, xoff:4, yoff:5  },
        blink1: { x:105, y:0, w:54, h:122, xoff:3, yoff:1 },
        blink2: { x:160, y:0, w:53, h:122, xoff:4, yoff:2 },
        happy1: { x:213, y:0, w:54, h:125, xoff:1, yoff:-1 },
        happy2: { x:267, y:0, w:53, h:128, xoff:0, yoff:-4 },
        left1: { x:320, y:0, w:74, h:119, xoff:0, yoff:4 },
        left2: { x:394, y:0, w:74, h:118, xoff:0, yoff:4 },
        left3: { x:468, y:0, w:46, h:124, xoff:0, yoff:0 },
        left4: { x:514, y:0, w:52, h:119, xoff:0, yoff:4 },
        left5: { x:566, y:0, w:74, h:119, xoff:0, yoff:5 },
        left6: { x:640, y:0, w:75, h:122, xoff:0, yoff:2 },
        left7: { x:715, y:0, w:45, h:123, xoff:0, yoff:1 },
        left8: { x:760, y:0, w:59, h:123, xoff:0, yoff:1 },
        right1: { x:819, y:0, w:74, h:119, xoff:0, yoff:4 },
        right2: { x:893, y:0, w:74, h:118, xoff:0, yoff:4 },
        right3: { x:967, y:0, w:46, h:124, xoff:0, yoff:0 },
        right4: { x:1013, y:0, w:52, h:119, xoff:0, yoff:4 },
        right5: { x:1065, y:0, w:74, h:119, xoff:0, yoff:5 },
        right6: { x:1139, y:0, w:75, h:122, xoff:0, yoff:2 },
        right7: { x:1214, y:0, w:45, h:123, xoff:0, yoff:1 },
        right8: { x:1259, y:0, w:59, h:123, xoff:0, yoff:1 },
        stand1: { x:1318, y:0, w:61, h:126, xoff:0, yoff:0 }
      };
      
      var spriteSheet = new SpriteSheet('/assets/images/dontclick/dude.png', frames);
      
      this.spriteSheet = spriteSheet;
      
      var animations = {
        stand: [
          {frame:'stand1',time:2}
        ],
        blink: [
          {frame:'blink1',time:0.1},
          {frame:'blink2',time:0.1},
          {frame:'blink1',time:0.1}
        ],
        angry: [
          {frame:'angry1',time:0.1},
          {frame:'angry2',time:3},
          {frame:'angry1',time:3}
        ],
        happy: [
          {frame:'happy1',time:0.1},
          {frame:'happy2',time:3},
          {frame:'happy1',time:0.1}
        ],
        left: [
          {frame:'left1', time:0.1, x:-21 },
          {frame:'left2', time:0.1, x:-6  },
          {frame:'left3', time:0.1, x:-11 },
          {frame:'left4', time:0.1, x:-10 },
          {frame:'left5', time:0.1, x:-28 },
          {frame:'left6', time:0.1, x:-6  },
          {frame:'left7', time:0.1, x:-10 },
          {frame:'left8', time:0.1, x:-15 }
        ],
        right: [
          {frame:'right1', time:0.1, x:8  },
          {frame:'right2', time:0.1, x:6  },
          {frame:'right3', time:0.1, x:38 },
          {frame:'right4', time:0.1, x:5  },
          {frame:'right5', time:0.1, x:5  },
          {frame:'right6', time:0.1, x:5  },
          {frame:'right7', time:0.1, x:40 },
          {frame:'right8', time:0.1, x:2  }
        ]
      };
      
      this.animations = animations;
      
      this.dudes = [];
      
      var dude = this.addDude();
      dude.setPosition(this.width/2-25,0);
      dude.playAnimation('stand');

      return spriteSheet.$deferred;
      
    },
    
    initCanvas: function() {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      this.width = this.canvas.width = this.$container.width();
      this.height = this.canvas.height = this.$container.height();
      this.$container.append(this.canvas);
    },
    
    initAnimation: function() {
      this.fps = 25;
      this.render();
    },
    
    initClickHandler: function() {
      var that = this;
      this.$container.click(function(){
        for (var i=0; i<that.dudes.length; i++) {
          that.dudes[i].interrupt();
        }
        var dude = that.addDude();
        var random = Math.random() * 100;
        if (random<50) {
          dude.setPosition(-50, 0);
          dude.playAnimation('right');
        }
        else {
          dude.setPosition(that.width, 0);
          dude.playAnimation('left');
        }
      });
    },
    
    addDude: function() {
      var dude = new Dude(this.spriteSheet, this.animations, this);
      this.dudes.push(dude);
      return dude;
    },
    
    render: function() {
      var that = this;
      var $renderProxy = $.proxy(this.render, this);
      setTimeout(function() {
          requestAnimationFrame($renderProxy);
          that.update();
          that.draw();
      }, 1000 / this.fps);
    },
    
    update: function() {
      for (var i=0; i<this.dudes.length; i++) {
        this.dudes[i].update();
      }
    },
    
    draw: function() {
      this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
      for (var i=0; i<this.dudes.length; i++) {
        this.dudes[i].render(this.canvas);
      }
    }
      
  };
  
  App.start($('.fun'));
  
}(jQuery);


