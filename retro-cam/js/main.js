document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const processCanvas = document.getElementById('processCanvas');
    const outputCanvas = document.getElementById('outputCanvas');
    const processCtx = processCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');
    const selectionBox = document.getElementById('selectionBox');
    
    let currentFilter = 'atkinson';
    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    let selectionEnd = { x: 0, y: 0 };
    
    const width = 640;
    const height = 480;
    
    processCanvas.width = width;
    processCanvas.height = height;
    outputCanvas.width = width;
    outputCanvas.height = height;
    
    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: width, 
                    height: height 
                } 
            });
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                video.play();
                requestAnimationFrame(processFrame);
            };
        } catch (err) {
            console.error('Ошибка доступа к камере:', err);
            outputCtx.fillStyle = 'var(--text-color)';
            outputCtx.font = '20px DOS';
            outputCtx.textAlign = 'center';
            outputCtx.fillText('ОШИБКА ДОСТУПА К КАМЕРЕ', width/2, height/2);
        }
    }
    
    function processFrame() {
        processCtx.drawImage(video, 0, 0, width, height);
        
        const imageData = processCtx.getImageData(0, 0, width, height);
        
        if (currentFilter === 'atkinson') {
            applyAtkinsonDithering(imageData);
        } else if (currentFilter === 'floydSteinberg') {
            applyFloydSteinbergDithering(imageData);
        } else if (currentFilter === 'ascii') {
            applyAsciiRendering(imageData);
        } else if (currentFilter === 'bitmap') {
            applyBitmapRendering(imageData);
        }
        
        outputCtx.putImageData(imageData, 0, 0);
        
        requestAnimationFrame(processFrame);
    }
    
    function applyAtkinsonDithering(imageData) {
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                const oldR = pixels[idx];
                const oldG = pixels[idx + 1];
                const oldB = pixels[idx + 2];
                
                const gray = Math.round(0.299 * oldR + 0.587 * oldG + 0.114 * oldB);
                
                const newPixel = gray > 128 ? 255 : 0;
                
                pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = newPixel;
                
                const err = Math.floor((gray - newPixel) / 8);
                
                if (x + 1 < width) {
                    pixels[(y * width + x + 1) * 4] += err;
                    pixels[(y * width + x + 1) * 4 + 1] += err;
                    pixels[(y * width + x + 1) * 4 + 2] += err;
                }
                if (x + 2 < width) {
                    pixels[(y * width + x + 2) * 4] += err;
                    pixels[(y * width + x + 2) * 4 + 1] += err;
                    pixels[(y * width + x + 2) * 4 + 2] += err;
                }
                if (y + 1 < height) {
                    if (x - 1 > 0) {
                        pixels[((y + 1) * width + x - 1) * 4] += err;
                        pixels[((y + 1) * width + x - 1) * 4 + 1] += err;
                        pixels[((y + 1) * width + x - 1) * 4 + 2] += err;
                    }
                    pixels[((y + 1) * width + x) * 4] += err;
                    pixels[((y + 1) * width + x) * 4 + 1] += err;
                    pixels[((y + 1) * width + x) * 4 + 2] += err;
                    if (x + 1 < width) {
                        pixels[((y + 1) * width + x + 1) * 4] += err;
                        pixels[((y + 1) * width + x + 1) * 4 + 1] += err;
                        pixels[((y + 1) * width + x + 1) * 4 + 2] += err;
                    }
                }
                if (y + 2 < height) {
                    pixels[((y + 2) * width + x) * 4] += err;
                    pixels[((y + 2) * width + x) * 4 + 1] += err;
                    pixels[((y + 2) * width + x) * 4 + 2] += err;
                }
            }
        }
        
        for (let i = 0; i < pixels.length; i += 4) {
            // Устанавливаем цвета в чёрно-бирюзовую гамму
            const isBlack = pixels[i] > 128;
            pixels[i] = isBlack ? 0 : 0;      // R всегда 0
            pixels[i + 1] = isBlack ? 0 : 255; // G = 0 для черного, 255 для бирюзового
            pixels[i + 2] = isBlack ? 0 : 156; // B = 0 для черного, 156 для бирюзового
        }
    }
    
    function applyFloydSteinbergDithering(imageData) {
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                const oldR = pixels[idx];
                const oldG = pixels[idx + 1];
                const oldB = pixels[idx + 2];
                
                const gray = Math.round(0.299 * oldR + 0.587 * oldG + 0.114 * oldB);
                
                const newPixel = gray > 128 ? 255 : 0;
                
                pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = newPixel;
                
                const err = gray - newPixel;
                
                if (x + 1 < width) {
                    pixels[(y * width + x + 1) * 4] += err * 7 / 16;
                    pixels[(y * width + x + 1) * 4 + 1] += err * 7 / 16;
                    pixels[(y * width + x + 1) * 4 + 2] += err * 7 / 16;
                }
                
                if (y + 1 < height) {
                    if (x - 1 >= 0) {
                        pixels[((y + 1) * width + x - 1) * 4] += err * 3 / 16;
                        pixels[((y + 1) * width + x - 1) * 4 + 1] += err * 3 / 16;
                        pixels[((y + 1) * width + x - 1) * 4 + 2] += err * 3 / 16;
                    }
                    
                    pixels[((y + 1) * width + x) * 4] += err * 5 / 16;
                    pixels[((y + 1) * width + x) * 4 + 1] += err * 5 / 16;
                    pixels[((y + 1) * width + x) * 4 + 2] += err * 5 / 16;
                    
                    if (x + 1 < width) {
                        pixels[((y + 1) * width + x + 1) * 4] += err * 1 / 16;
                        pixels[((y + 1) * width + x + 1) * 4 + 1] += err * 1 / 16;
                        pixels[((y + 1) * width + x + 1) * 4 + 2] += err * 1 / 16;
                    }
                }
            }
        }
        
        for (let i = 0; i < pixels.length; i += 4) {
            // Устанавливаем цвета в чёрно-бирюзовую гамму
            const isBlack = pixels[i] > 128;
            pixels[i] = isBlack ? 0 : 0;      // R всегда 0
            pixels[i + 1] = isBlack ? 0 : 255; // G = 0 для черного, 255 для бирюзового
            pixels[i + 2] = isBlack ? 0 : 156; // B = 0 для черного, 156 для бирюзового
        }
    }
    
    function applyAsciiRendering(imageData) {
        // Сначала очищаем данные изображения
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = 0;      // R = 0 (черный)
            pixels[i + 1] = 0;  // G = 0 (черный)
            pixels[i + 2] = 0;  // B = 0 (черный)
            pixels[i + 3] = 255; // Alpha = 255 (непрозрачный)
        }
        
        // Рисуем ASCII поверх изображения
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(0, 0, width, height);
        tempCtx.fillStyle = '#00ff9c'; // бирюзовый цвет для текста
        tempCtx.font = '8px monospace';
        
        const blockSize = 8;
        const asciiChars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];
        
        // Рисуем ASCII символы
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                if (y + blockSize > height || x + blockSize > width) continue;
                
                let sum = 0;
                let count = 0;
                
                for (let j = 0; j < blockSize; j++) {
                    for (let i = 0; i < blockSize; i++) {
                        const idx = ((y + j) * width + (x + i)) * 4;
                        sum += (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                        count++;
                    }
                }
                
                if (count > 0) {
                    const avg = sum / count;
                    const charIndex = Math.min(Math.floor(avg / 256 * asciiChars.length), asciiChars.length - 1);
                    const char = asciiChars[charIndex];
                    
                    tempCtx.fillText(char, x, y + blockSize);
                }
            }
        }
        
        // Копируем данные из временного холста обратно в imageData
        const tempImageData = tempCtx.getImageData(0, 0, width, height);
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = tempImageData.data[i];
            pixels[i + 1] = tempImageData.data[i + 1];
            pixels[i + 2] = tempImageData.data[i + 2];
        }
    }
    
    function applyBitmapRendering(imageData) {
        const pixels = imageData.data;
        const blockSize = 8;
        
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                if (y + blockSize > height || x + blockSize > width) continue;
                
                let sum = 0;
                let count = 0;
                
                for (let j = 0; j < blockSize; j++) {
                    for (let i = 0; i < blockSize; i++) {
                        const idx = ((y + j) * width + (x + i)) * 4;
                        sum += (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                        count++;
                    }
                }
                
                if (count > 0) {
                    const avg = sum / count;
                    const color = avg > 128 ? 0 : 255;
                    
                    for (let j = 0; j < blockSize; j++) {
                        for (let i = 0; i < blockSize; i++) {
                            if (y + j < height && x + i < width) {
                                const idx = ((y + j) * width + (x + i)) * 4;
                                pixels[idx] = pixels[idx + 1] = pixels[idx + 2] = color == 0 ? 0 : 0;
                                pixels[idx + 1] = color == 0 ? 0 : 255;
                                pixels[idx + 2] = color == 0 ? 0 : 156;
                            }
                        }
                    }
                }
            }
        }
    }
    
    function toggleSelectionBox() {
        isSelecting = !isSelecting;
        selectionBox.style.display = isSelecting ? 'block' : 'none';
        if (!isSelecting) {
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.left = '0px';
            selectionBox.style.top = '0px';
        }
    }
    
    function startSelection(e) {
        if (!isSelecting) return;
        
        const rect = outputCanvas.getBoundingClientRect();
        selectionStart.x = e.clientX - rect.left;
        selectionStart.y = e.clientY - rect.top;
        
        selectionBox.style.left = selectionStart.x + 'px';
        selectionBox.style.top = selectionStart.y + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
    }
    
    function updateSelection(e) {
        if (!isSelecting) return;
        
        const rect = outputCanvas.getBoundingClientRect();
        selectionEnd.x = Math.min(Math.max(0, e.clientX - rect.left), width);
        selectionEnd.y = Math.min(Math.max(0, e.clientY - rect.top), height);
        
        const boxLeft = Math.min(selectionStart.x, selectionEnd.x);
        const boxTop = Math.min(selectionStart.y, selectionEnd.y);
        const boxWidth = Math.abs(selectionEnd.x - selectionStart.x);
        const boxHeight = Math.abs(selectionEnd.y - selectionStart.y);
        
        selectionBox.style.left = boxLeft + 'px';
        selectionBox.style.top = boxTop + 'px';
        selectionBox.style.width = boxWidth + 'px';
        selectionBox.style.height = boxHeight + 'px';
    }
    
    function captureScreenshot() {
        const link = document.createElement('a');
        link.download = 'retrocam-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
        link.href = outputCanvas.toDataURL('image/png');
        link.click();
    }
    
    function cycleFilter() {
        const filters = ['atkinson', 'floydSteinberg', 'ascii', 'bitmap'];
        const currentIndex = filters.indexOf(currentFilter);
        currentFilter = filters[(currentIndex + 1) % filters.length];
        
        // Обновляем статус фильтра на экране
        const statusEl = document.querySelector('.status-item:first-child');
        const filterNames = {
            'atkinson': 'Atkinson',
            'floydSteinberg': 'Floyd-Steinberg',
            'ascii': 'ASCII',
            'bitmap': 'Bitmap'
        };
        statusEl.textContent = `CTRL+F Filter: ${filterNames[currentFilter] || currentFilter}`;
        
        console.log('Текущий фильтр:', currentFilter);
    }
    
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    captureScreenshot();
                } else {
                    captureScreenshot();
                }
                break;
            case 'd':
                break;
            case 'c':
                captureScreenshot();
                break;
            case 'f':
                if (e.ctrlKey) {
                    e.preventDefault();
                    cycleFilter();
                } else {
                    cycleFilter();
                }
                break;
            case 'escape':
                toggleSelectionBox();
                break;
            case 'q':
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (confirm('Выйти из приложения?')) {
                        window.close();
                    }
                }
                break;
        }
    });
    
    outputCanvas.addEventListener('mousedown', startSelection);
    outputCanvas.addEventListener('mousemove', updateSelection);
    
    setupCamera();
});
