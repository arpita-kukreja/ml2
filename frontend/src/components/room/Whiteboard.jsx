import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const Whiteboard = forwardRef(({ sendDraw }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#f1f5f9');
  const [brushSize, setBrushSize] = useState(3);

  const colors = ['#f1f5f9', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
  const sizes = [2, 5, 10];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set actual size matching display size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

      const handleResize = () => {
      if (!canvas.parentElement) return;
      const r = canvas.parentElement.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = r.width;
      canvas.height = r.height;
      
      const newCtx = canvas.getContext('2d');
      newCtx.lineCap = 'round';
      newCtx.lineJoin = 'round';
      newCtx.putImageData(temp, 0, 0);
      contextRef.current = newCtx;
    };
    
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    drawStroke: (payload) => {
      const { x, y, prevX, prevY, color: c, brushSize: s } = payload;
      const ctx = contextRef.current;
      if (!ctx) return;
      
      ctx.beginPath();
      ctx.strokeStyle = c;
      ctx.lineWidth = s;
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }));

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const { offsetX, offsetY, prevX, prevY } = getCoordinates(e);
    
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = brushSize;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    sendDraw({ x: offsetX, y: offsetY, prevX, prevY, color, brushSize });
    
    canvasRef.current._prevX = offsetX;
    canvasRef.current._prevY = offsetY;
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
    canvasRef.current._prevX = null;
    canvasRef.current._prevY = null;
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const prevX = canvas._prevX ?? x;
    const prevY = canvas._prevY ?? y;
    
    return { offsetX: x, offsetY: y, prevX, prevY };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col h-full animate-in bg-[#050505]">
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-[#161b27]">
        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white shadow-lg' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                className={`w-8 h-8 rounded border transition-colors flex items-center justify-center ${brushSize === s ? 'border-white bg-gray-800' : 'border-gray-700 hover:bg-gray-800'}`}
                onClick={() => setBrushSize(s)}
              >
                <div className="bg-white rounded-full" style={{ width: s*1.5, height: s*1.5 }}></div>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost text-xs px-3 py-1 text-red-400 border-red-900" onClick={clearCanvas}>Clear</button>
        </div>
      </div>

      <div className="flex-1 bg-black relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
});

export default Whiteboard;
