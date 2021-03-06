import * as THREE from './../module/build/three.module.js'

class FirstPersonControls
	constructor: (options)->
		@kc={
			"w": 87,
			"s": 83,
			"a": 65,
			"d": 68,
			"space": 32,
			"shift": 16
		}
		@keys={}
		@canvas=options.canvas
		@camera=options.camera
		@micromove=options.micromove
		@gameState="menu"
	ac: (qx, qy, qa, qf)->
		m_x = -Math.sin(qa) * qf;
		m_y = -Math.cos(qa) * qf;
		r_x = qx - m_x;
		r_y = qy - m_y;
		return {
			x: r_x,
			y: r_y
		}
	camMicroMove: ->
		if @keys[@kc["w"]]
			@camera.position.x = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y + THREE.MathUtils.degToRad(180), @micromove).x
			@camera.position.z = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y + THREE.MathUtils.degToRad(180), @micromove).y
		if @keys[@kc["s"]]
			@camera.position.x = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y, @micromove).x
			@camera.position.z = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y, @micromove).y
		if @keys[@kc["a"]]
			@camera.position.x = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y - THREE.MathUtils.degToRad(90), @micromove).x
			@camera.position.z = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y - THREE.MathUtils.degToRad(90), @micromove).y
		if @keys[@kc["d"]]
			@camera.position.x = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y + THREE.MathUtils.degToRad(90), @micromove).x
			@camera.position.z = @ac(@camera.position.x, @camera.position.z, @camera.rotation.y + THREE.MathUtils.degToRad(90), @micromove).y
		if @keys[@kc["space"]]
			@camera.position.y += @micromove
		if @keys[@kc["shift"]]
			@camera.position.y -= @micromove
	updatePosition: (e)->
		if @gameState is "game"
			@camera.rotation.x -= THREE.MathUtils.degToRad e.movementY / 10
			@camera.rotation.y -= THREE.MathUtils.degToRad e.movementX / 10
			if THREE.MathUtils.radToDeg( @camera.rotation.x ) < -90
				@camera.rotation.x = THREE.MathUtils.degToRad -90
			if THREE.MathUtils.radToDeg( @camera.rotation.x ) > 90
				@camera.rotation.x = THREE.MathUtils.degToRad 90
		return
	lockChangeAlert: ->
		_this=@
		@handler=
		if document.pointerLockElement is @canvas or document.mozPointerLockElement is @canvas
			$(".gameMenu").css "display", "none"
			@gameState="game"
		else
			$(".gameMenu").css "display", "block"
			@gameState="menu"
		return
	listen: ->
		_this=@
		$(window).keydown (z) ->
			_this.keys[z.keyCode] = true
			return
		$(document).keyup (z) ->
			delete _this.keys[z.keyCode]
			return
		$(".gameOn").click ->
			console.log "clicked!"
			_this.canvas.requestPointerLock()
			return
		document.addEventListener 'pointerlockchange', ()->
			_this.lockChangeAlert()
		, false
		document.addEventListener 'mozpointerlockchange', ()->
			_this.lockChangeAlert()
		, false
		document.addEventListener "mousemove", (e)->
			_this.updatePosition(e)
		, false
		return @

export {FirstPersonControls}