
var Renderer = function(width, 
						height, 
						context) {
	this.width = width;
	this.height = height;
	this.context = context;

	
	// properties
	this.centerX = this.width/2;
	this.centerY = this.height/2;
	this.PI = 3.14159265;
};

Renderer.prototype.drawWireFrame = function(decoder,
										    mag,			// [in] magnification
										    rX,
										    rY,
										    rZ) {
	this.mag = mag;
	this.decoder = decoder;
	this.rX = rX;
	this.rY = rY;
	this.rZ = rZ;
	
	this.pos = 0;
	for(var i=0; i<decoder.listFace.length; i++) {
		var face = decoder.readFace(i);
		
		if(!this.drawTriangles(face))
			return false;
	}
	return true;
};
		
Renderer.prototype.drawTriangles = function(face) {
		this.context.beginPath();
		
		// convert rotation from degrees to radian
		var radX = this.PI / 180.0 * this.rX;
		var radY = this.PI / 180.0 * this.rY;
		var radZ = this.PI / 180.0 * this.rZ;	
					
		var vtx0 = [0,0,0];
		var vtx1;
		if(face.length<4)			// must be at least a triangle
			return false;
		
		// draw 
		for(j=1; j<face.length; j++) {  
			// retrieve vertices
			var vIndex = face[j];
			if(vIndex>=this.decoder.listVertex.length||vIndex<0)
				return false;
			
			// retrieve vertex
			var vtx1 = this.decoder.readVertex(vIndex);
		
			// rotation Y
			vtx1[1] = Math.cos(radX)*vtx1[1]-Math.sin(radX)*vtx1[2];
					  
			// draw 2 lengths of a triangle
			if(j==1) {
				this.context.moveTo(vtx1[0]*this.mag+ this.centerX, 
						 		    vtx1[1]*this.mag+ this.centerY);				// move to 1st triangle corner
				vtx0[0] = vtx1[0];
				vtx0[1] = vtx1[1];
				vtx0[2] = vtx1[2];
			}
			else 
				this.context.lineTo(vtx1[0]*this.mag+ this.centerX, 
							   		vtx1[1]*this.mag+ this.centerY);				// render only (x,y)
		} 
		// complete triangle
		this.context.lineTo(vtx0[0]*this.mag+ this.centerX, 
							vtx0[1]*this.mag+ this.centerY);						// compete the loop
		
		// render on canvase
		this.context.stroke();
		this.context.closePath();
		return true;
};
