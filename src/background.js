export class FancyBackground {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.time = 0;
        
        this.decorations = [];
        this.texts = ["LET IT ALL GO!", "Why aren't you tired", "fAnCy tHaT!", "gIrL LiKe mE"];
        this.decorTypes = ['star', 'crown', 'lips', 'cherry'];
        
        for (let i = 0; i < 20; i++) {
            this.decorations.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                type: Math.random() > 0.5 ? 'text' : 'icon',
                content: Math.random() > 0.5 ? this.texts[Math.floor(Math.random() * this.texts.length)] : this.decorTypes[Math.floor(Math.random() * this.decorTypes.length)],
                speed: 0.5 + Math.random(),
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.05,
                scale: 0.5 + Math.random() * 1.5,
                color: ['#ff0055', '#00ccff', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)]
            });
        }
    }

    update(time, beatPulse) {
        this.time = time;
        this.draw(beatPulse);
    }
    
    draw(beatPulse) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // 1. Base Layer: Tartan/Plaid pattern
        this.drawTartan(ctx, width, height);

        // Calculate bounce scale based on beatPulse
        const squashY = 1 - (beatPulse * 0.2);
        const stretchX = 1 + (beatPulse * 0.1);

        // 2. Parallax Layers
        // Layer 1 (Slowest): Big Ben & Parliament
        const scroll1 = (this.time * 0.02) % width;
        this.drawParallaxLayer(ctx, width, height, -scroll1, height * 0.6, width, stretchX, squashY, this.drawBigBen.bind(this));
        
        // Layer 2 (Medium): Red Brick Houses
        const scroll2 = (this.time * 0.05) % width;
        this.drawParallaxLayer(ctx, width, height, -scroll2, height * 0.8, width * 0.5, stretchX, squashY, this.drawHouses.bind(this));
        
        // Layer 3 (Fastest): Red Telephone Booths and London Bus Stop signs
        const scroll3 = (this.time * 0.1) % width;
        this.drawParallaxLayer(ctx, width, height, -scroll3, height * 0.9, width * 0.3, stretchX, squashY, this.drawStreetItems.bind(this));
        
        // 4. Floating Texts & Decor
        this.drawDecorations(ctx, width, height, beatPulse);
        
        ctx.restore();
    }
    
    drawTartan(ctx, width, height) {
        const offsetX = (this.time * 0.01) % 100;
        const offsetY = (this.time * 0.01) % 100;
        
        ctx.fillStyle = '#cc0000'; // Red base
        ctx.fillRect(0, 0, width, height);
        
        ctx.lineWidth = 20;
        ctx.fillStyle = '#000033'; // Navy
        for (let i = -100 + offsetX; i < width; i += 100) {
            ctx.fillRect(i, 0, 20, height);
        }
        for (let i = -100 + offsetY; i < height; i += 100) {
            ctx.fillRect(0, i, width, 20);
        }
        
        ctx.fillStyle = '#ffcc00'; // Gold
        for (let i = -50 + offsetX; i < width; i += 100) {
            ctx.fillRect(i, 0, 5, height);
        }
        for (let i = -50 + offsetY; i < height; i += 100) {
            ctx.fillRect(0, i, width, 5);
        }
        
        ctx.fillStyle = '#000000'; // Black
        for (let i = -10 + offsetX; i < width; i += 100) {
            ctx.fillRect(i, 0, 2, height);
            ctx.fillRect(i + 40, 0, 2, height);
        }
        for (let i = -10 + offsetY; i < height; i += 100) {
            ctx.fillRect(0, i, width, 2);
            ctx.fillRect(0, i + 40, width, 2);
        }
    }
    
    drawParallaxLayer(ctx, width, height, startX, baseY, sectionWidth, scaleX, scaleY, drawFn) {
        ctx.save();
        ctx.translate(0, baseY);
        
        let x = startX;
        while (x > 0) x -= sectionWidth;
        
        while (x < width) {
            ctx.save();
            ctx.translate(x + sectionWidth / 2, 0);
            ctx.scale(scaleX, scaleY);
            ctx.translate(-(x + sectionWidth / 2), 0);
            
            drawFn(ctx, x, 0, sectionWidth);
            ctx.restore();
            x += sectionWidth;
        }
        
        ctx.restore();
    }
    
    drawBigBen(ctx, x, y, width) {
        ctx.fillStyle = '#000033';
        ctx.fillRect(x, y - 100, width * 0.7, 100);
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 40 + 10, y - 100);
            ctx.lineTo(x + i * 40 + 20, y - 130);
            ctx.lineTo(x + i * 40 + 30, y - 100);
            ctx.fill();
        }
        const benX = x + width * 0.7;
        ctx.fillRect(benX, y - 250, 60, 250);
        ctx.beginPath();
        ctx.moveTo(benX - 10, y - 250);
        ctx.lineTo(benX + 30, y - 320);
        ctx.lineTo(benX + 70, y - 250);
        ctx.fill();
        ctx.fillStyle = '#ffeeaa';
        ctx.beginPath();
        ctx.arc(benX + 30, y - 220, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHouses(ctx, x, y, width) {
        ctx.fillStyle = '#b32400';
        ctx.fillRect(x + 10, y - 120, width - 20, 120);
        
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(x, y - 120);
        ctx.lineTo(x + width / 2, y - 180);
        ctx.lineTo(x + width, y - 120);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                ctx.fillRect(x + 30 + c * 50, y - 100 + r * 50, 30, 40);
            }
        }
    }
    
    drawStreetItems(ctx, x, y, width) {
        ctx.fillStyle = '#e60000';
        ctx.fillRect(x + 20, y - 80, 40, 80);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 25, y - 70, 30, 40);
        
        ctx.fillStyle = '#e60000';
        ctx.beginPath();
        ctx.arc(x + 40, y - 80, 20, Math.PI, 0);
        ctx.fill();
        
        const signX = x + width - 50;
        ctx.fillStyle = '#555555';
        ctx.fillRect(signX, y - 100, 5, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(signX + 2.5, y - 100, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e60000';
        ctx.beginPath();
        ctx.arc(signX + 2.5, y - 100, 15, 0, Math.PI * 2);
        ctx.arc(signX + 2.5, y - 100, 10, 0, Math.PI * 2, true);
        ctx.fill();
        
        ctx.fillStyle = '#0000cc';
        ctx.fillRect(signX - 15, y - 105, 35, 10);
    }
    
    drawDecorations(ctx, width, height, beatPulse) {
        this.decorations.forEach(decor => {
            decor.y -= decor.speed;
            decor.angle += decor.spin;
            if (decor.y < -100) {
                decor.y = height + 100;
                decor.x = Math.random() * width;
            }
            
            ctx.save();
            ctx.translate(decor.x, decor.y);
            ctx.rotate(decor.angle);
            
            const bounce = 1 + beatPulse * 0.2;
            ctx.scale(decor.scale * bounce, decor.scale * bounce);
            
            if (decor.type === 'text') {
                ctx.fillStyle = decor.color;
                ctx.font = 'bold 30px Impact, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeText(decor.content, 0, 0);
                ctx.fillText(decor.content, 0, 0);
            } else {
                this.drawIcon(ctx, decor.content, decor.color);
            }
            
            ctx.restore();
        });
    }
    
    drawIcon(ctx, type, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        if (type === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 20, -Math.sin((18 + i * 72) * Math.PI / 180) * 20);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 10, -Math.sin((54 + i * 72) * Math.PI / 180) * 10);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (type === 'crown') {
            ctx.beginPath();
            ctx.moveTo(-20, 10);
            ctx.lineTo(-25, -15);
            ctx.lineTo(-10, -5);
            ctx.lineTo(0, -20);
            ctx.lineTo(10, -5);
            ctx.lineTo(25, -15);
            ctx.lineTo(20, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (type === 'lips') {
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.quadraticCurveTo(0, 5, 20, 0);
            ctx.stroke();
        } else if (type === 'cherry') {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-10, 10, 10, 0, Math.PI * 2);
            ctx.arc(10, 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.quadraticCurveTo(0, -15, 10, -20);
            ctx.moveTo(10, 0);
            ctx.quadraticCurveTo(5, -15, 10, -20);
            ctx.stroke();
        }
    }
}
