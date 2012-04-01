(function() {
  /*
  #	Module:			PLY.js
  #	
  #	Description:	decode PLY 3D file
  #					modified Devon Govett's bmp.js
  #
  #	Reference:
  # 	BMP.js		http://devongovett.github.com/bmp.js/
  #		PLY specs	http://en.wikipedia.org/wiki/PLY_(file_format)
  #		tool:		http://www.cc.gatech.edu/projects/large_models/ply.html
  #     samples:	http://people.sc.fsu.edu/~jburkardt/data/ply/ply.html
  # Author(s):		Devon Govett provide a bmp decoding example.
  # 				C.T. Yeung modify to decode PLY.
  #  
  # History:		
  # MIT LICENSE
  # Copyright (c) 2012 CT Yeung
  # Copyright (c) 2011 Devon Govett
  # 
  # Permission is hereby granted, free of charge, to any person obtaining a copy of this 
  # software and associated documentation files (the "Software"), to deal in the Software 
  # without restriction, including without limitation the rights to use, copy, modify, merge, 
  # publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
  # to whom the Software is furnished to do so, subject to the following conditions:
  # 
  # The above copyright notice and this permission notice shall be included in all copies or 
  # substantial portions of the Software.
  # 
  # THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
  # BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  # NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
  # DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
  # OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */  
  
  var PLY;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  //var PI = 3.14159265;
	
	PLY = (function() {
		PLY.load = function(url, callback) {
			var xhr;
			xhr = new XMLHttpRequest;
			xhr.open("GET", url, true);
			xhr.responseType = "arraybuffer";
			xhr.onload = __bind(function() {
				var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
				return callback(new PLY(data));
			}, this);
			return xhr.send(null);
		};
		
		function PLY(data) {		
			this.data = data;
			this.numVertices = 0;
			this.numFaces = 0;
			this.listVertex = null;
			this.listFace = null;
			this.listComment = null;
			this.listEdge = null;
			this.format = "unknown";
			
			this.FORMAT_ASCII_TEXT = "ascii";
			this.FORMAT_BINARY_LITTLE_END_TEXT = "binary_little_endian";
			this.FORMAT_BINARY_BIG_END_TEXT = "binary_big_endian";
			
			this.FORMAT_ASCII_ENUM = 0;
			this.FORMAT_BINARY_LITTLE_END_ENUM = 1;
			this.FORMAT_BINARY_BIG_END_ENUM = 2;
			
			this.VERTEX_TEXT = "vertex";
			this.FACE_TEXT = "face";
		}
		
		// return true/false for finding/loading vertex
		PLY.prototype.readVertex = function(index) {
			var sttPos = this.listVertex[index];
			var endPos = this.findEndPos(sttPos);		// return EOF pos if not found
			var vString = this.bin2String(sttPos, endPos);
			var list = vString.split(" ");
			
			if(list.length<3)
				return null;							// invalid vertex
				
			var vertex = new Array();
			for(var i=0; i<3; i++) 
				vertex.push(Number(list[i]));
				
			return vertex;
		};
		
		PLY.prototype.readFace = function(index) {
			var sttPos = this.listFace[index];
			var endPos = this.findEndPos(sttPos);
			var vString = this.bin2String(sttPos, endPos);
			var list = vString.split(" ");
			
			if(list.length<4)
				return null;							// numVertex, vertex1, vertex2, ...
				
			var face = new Array();
			for(var i=0; i<list.length; i++) {
				if(list[i])
					face.push(parseInt(list[i]));
			}
				
			return face;
		};

		PLY.prototype.bin2String = function(sttPos, endPos) {
			var buf="";
			for(var i=sttPos; i<endPos; i++) {
				var char = this.data[i].toString();
				buf += String.fromCharCode(char);
			}
			return buf.replace('\r', '');
		};
		
		// return upon first non number, non dot, not space
		PLY.prototype.findEndPos = function(stt) {
			var i = stt;
			while(i<(this.data.length-1)) {
				// seek linefeed
				if(this.data[i]==10)
					return i;
				i++;
			}			
			return this.data.length-1;
		};
		
		PLY.prototype.getLineType = function(sttPos, endPos) {
			var str = "";
			for(var i=sttPos; i<endPos; i++) {
				var char = String.fromCharCode(this.data[i]);	
				if(char==' '||char=='\r')
					return str;
				else
					str += char;
			}
			return str;
		};
		
		// file must begin with "ply"
		PLY.prototype.hasMagicNum = function() {
			var str = "";
			for(var i=0; i<3; i++) 
				str += String.fromCharCode(this.data[i]);
				
			return ("ply"==str)?true:false;
		};
	
		// file can be ascii, binary (little or big endian)
		PLY.prototype.parseFormat = function(sttPos, endPos) {
			var str = this.bin2String(sttPos, endPos);
			this.format = (str.indexOf(this.FORMAT_ASCII_TEXT)>=0)?this.FORMAT_ASCII_ENUM:
						  (str.indexOf(this.FORMAT_BINARY_LITTLE_END_TEXT)>=0)?this.FORMAT_BINARY_LITTLE_END_ENUM:
						  (str.indexOf(this.FORMAT_BINARY_BIG_END_TEXT)>=0)?this.FORMAT_BINARY_BIG_END_ENUM:"error";
		};
		
		PLY.prototype.parseElement = function(sttPos, 
											  endPos) {
			var str = this.bin2String(sttPos, endPos);
			var pos = str.indexOf(this.VERTEX_TEXT);
			if(pos>0) {
				str = str.substr(pos+6, str.length);
				this.numVertices = parseInt(str);
				return true;
			}
			else {
				pos = str.indexOf(this.FACE_TEXT);
				if (pos>0) {
					str = str.substr(pos+4, str.length);
					this.numFaces = parseInt(str);
					return true;
				}
			}
			return false;
		};
		
		// important for binary formats
		PLY.prototype.dataLength = function(type) {
			switch(type) {
				case "char":
				case "uchar":
				return 1;
				
				case "short":
				case "ushort":
				return 2;
				
				case "int":
				case "uint":
				case "float":
				return 4;
				
				case "double":
				return 8;
			}
			return 0;
		};
		
		// header is ascii and contains file information
		// line 1: ply
		// line 2: format
		// lines containing keywords: element, comment, property
		// last line: end_header
		PLY.prototype.parseHeader = function() {
			
			this.listComment = new Array();
			while(this.pos < this.data.length-1) {
				var endPos = this.findEndPos(this.pos);
				var type = this.getLineType(this.pos, endPos);
				
				switch(type) {
					case "element":
					this.parseElement(this.pos, endPos);		
					break;
					
					case "property":
					break;
					
					case "comment":
					this.listComment.push(this.pos);
					break;
					
					case "format":
					this.parseFormat(this.pos, endPos);
					break;
					
					case "end_header":
					this.pos = ++endPos;
					return true;
					
					default:
				}
				this.pos = ++endPos;
			}
			return false;
		};
		
		PLY.prototype.parseVerticesPos = function() {
			this.listVertex = new Array();
			for(var i=0; i<this.numVertices; i++) {
				var endPos = this.findEndPos(this.pos);
				this.listVertex.push(this.pos);
				this.pos = ++endPos;
			}
			return true;
		};
		
		PLY.prototype.parseFacesPos = function() {
			this.listFace = new Array();
			for(var i=0; i<this.numFaces; i++) {
				var endPos = this.findEndPos(this.pos);
				this.listFace.push(this.pos);
				this.pos = ++endPos;
			}
			return true;
		};
		
		PLY.prototype.parseEdgePos = function() {
			this.listEdge = new Array();
			for(var i=0; i<this.numEdges; i++) {
				var endPos = this.findEndPos(this.pos);
				this.listEdge.push(this.pos);
				this.pos = ++endPos;
			}
			return true;
		};
		
		PLY.prototype.decode = function() {
			if(!this.hasMagicNum)							// file must begin with "ply"
				return 0;
				
			// parse header
			this.pos = 0;
			if(this.parseHeader()) {
				// not sure if order can change
				if(this.parseVerticesPos())
					if(this.parseFacesPos()) {
						this.parseEdgePos();
						return this.listFace.length;
					}
			}
			return 0;
		};
		
		return PLY;
	})();
	
	window.PLY = PLY;
}).call(this);
// JavaScript Document