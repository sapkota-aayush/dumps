<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dumps.online - Anonymous Social Platform</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            padding: 60px 40px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 30px 30px;
            animation: drift 20s linear infinite;
        }

        @keyframes drift {
            0% { transform: translate(0, 0); }
            100% { transform: translate(30px, 30px); }
        }

        .header h1 {
            font-size: 3.5em;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .header .tagline {
            font-size: 1.3em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
            font-weight: 300;
        }

        .badges {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
            position: relative;
            z-index: 1;
        }

        .badge {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section h2 {
            font-size: 2em;
            margin-bottom: 20px;
            color: #dc2626;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section h3 {
            font-size: 1.5em;
            margin: 30px 0 15px 0;
            color: #991b1b;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .feature-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 15px;
            transition: transform 0.3s, box-shadow 0.3s;
            border: 2px solid transparent;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
            border-color: #dc2626;
        }

        .feature-card h4 {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #dc2626;
        }

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 15px;
        }

        .tech-tag {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .stat-card {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .stat-label {
            font-size: 1em;
            opacity: 0.9;
        }

        .architecture {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            white-space: pre;
            line-height: 1.8;
        }

        .cta-section {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            border-radius: 15px;
            margin-top: 40px;
        }

        .cta-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }

        .btn {
            padding: 15px 35px;
            border-radius: 30px;
            font-size: 1.1em;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            border: 2px solid white;
        }

        .btn-primary {
            background: white;
            color: #dc2626;
        }

        .btn-primary:hover {
            background: transparent;
            color: white;
            transform: scale(1.05);
        }

        .btn-secondary {
            background: transparent;
            color: white;
        }

        .btn-secondary:hover {
            background: white;
            color: #dc2626;
            transform: scale(1.05);
        }

        .footer {
            background: #2d3748;
            color: white;
            padding: 40px;
            text-align: center;
        }

        .footer-links {
            display: flex;
            gap: 30px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .footer-links a {
            color: white;
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.3s;
        }

        .footer-links a:hover {
            opacity: 1;
        }

        code {
            background: #f1f3f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #dc2626;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.5em;
            }

            .content {
                padding: 20px;
            }

            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗑️ Dumps.online</h1>
            <p class="tagline">A safe, judgment-free space for SLC students to share thoughts, frustrations, and ideas anonymously</p>
            <div class="badges">
                <span class="badge">🔒 100% Anonymous</span>
                <span class="badge">📱 PWA Enabled</span>
                <span class="badge">⚡ Lightning Fast</span>
                <span class="badge">🎨 Modern Design</span>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>✨ Overview</h2>
                <p><strong>Dumps.online</strong> is a modern, anonymous social media platform built specifically for SLC (School Leaving Certificate) students. It's a Progressive Web App that allows students to share their thoughts, experiences, and ideas without revealing their identity, creating a safe space for authentic expression during this crucial phase of their academic journey.</p>
            </div>

            <div class="section">
                <h2>🎯 Key Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>🔒 Complete Anonymity</h4>
                        <p>No accounts, no tracking, complete privacy. Share your thoughts freely without fear of judgment.</p>
                    </div>
                    <div class="feature-card">
                        <h4>📱 Progressive Web App</h4>
                        <p>Install on any device, works offline. Access anywhere, anytime.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🎨 Beautiful Design</h4>
                        <p>Modern, responsive UI optimized for mobile devices with smooth animations.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🏷️ Hashtag System</h4>
                        <p>Organize posts by topics like #ExamStress #BoardPrep #Dreams and discover content easily.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🖼️ Rich Media Support</h4>
                        <p>Upload images and GIFs via Giphy integration to express yourself better.</p>
                    </div>
                    <div class="feature-card">
                        <h4>⚡ Real-time Reactions</h4>
                        <p>Express yourself with emoji reactions: 👍 ❤️ 😂 😠</p>
                    </div>
                    <div class="feature-card">
                        <h4>💭 Wild Thoughts</h4>
                        <p>Share spontaneous thoughts and connect with fellow students anonymously.</p>
                    </div>
                    <div class="feature-card">
                        <h4>📊 QR Code Tracking</h4>
                        <p>Track engagement metrics through QR code scans for campus promotions.</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>⚡ Performance Metrics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">&lt;2s</div>
                        <div class="stat-label">Page Load Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">&lt;100ms</div>
                        <div class="stat-label">API Response</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">90+</div>
                        <div class="stat-label">Lighthouse Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">1000+</div>
                        <div class="stat-label">Concurrent Users</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🛠️ Tech Stack</h2>
                
                <h3>Frontend</h3>
                <div class="tech-stack">
                    <span class="tech-tag">React 18.3</span>
                    <span class="tech-tag">TypeScript</span>
                    <span class="tech-tag">Vite 5.4</span>
                    <span class="tech-tag">Tailwind CSS 3.4</span>
                    <span class="tech-tag">Radix UI</span>
                    <span class="tech-tag">React Router 6</span>
                    <span class="tech-tag">TanStack Query</span>
                    <span class="tech-tag">Vite PWA Plugin</span>
                </div>

                <h3>Backend</h3>
                <div class="tech-stack">
                    <span class="tech-tag">FastAPI 0.104</span>
                    <span class="tech-tag">SQLAlchemy 2.0</span>
                    <span class="tech-tag">PostgreSQL</span>
                    <span class="tech-tag">Uvicorn</span>
                    <span class="tech-tag">Pydantic</span>
                    <span class="tech-tag">SlowAPI</span>
                </div>

                <h3>Infrastructure</h3>
                <div class="tech-stack">
                    <span class="tech-tag">AWS EC2</span>
                    <span class="tech-tag">AWS S3</span>
                    <span class="tech-tag">Nginx</span>
                    <span class="tech-tag">Cloudflare</span>
                </div>
            </div>

            <div class="section">
                <h2>🏗️ Architecture</h2>
                <div class="architecture">┌─────────────────┐
│   Cloudflare    │  DNS, CDN, SSL, DDoS Protection
└────────┬────────┘
         │
┌────────▼────────┐
│     Nginx       │  Reverse Proxy, Static Files
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│React  │ │FastAPI│  High-Performance API
│  PWA  │ │Backend│  + Rate Limiting
└───────┘ └───┬───┘
              │
         ┌────▼────┐
         │PostgreSQL│  Optimized Queries
         └─────────┘
              │
         ┌────▼────┐
         │  AWS S3 │  Image Storage & CDN
         └─────────┘</div>
            </div>

            <div class="section">
                <h2>🔒 Security Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>Rate Limiting</h4>
                        <p>20 posts/hour, 100 reactions/hour to prevent spam and abuse</p>
                    </div>
                    <div class="feature-card">
                        <h4>Input Validation</h4>
                        <p>Pydantic schemas validate all inputs at API level</p>
                    </div>
                    <div class="feature-card">
                        <h4>SQL Injection Protection</h4>
                        <p>SQLAlchemy ORM prevents SQL injection attacks</p>
                    </div>
                    <div class="feature-card">
                        <h4>HTTPS Only</h4>
                        <p>SSL/TLS encryption via Cloudflare for all traffic</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🚀 Quick Start</h2>
                <h3>Prerequisites</h3>
                <p>• Node.js 18+ and npm<br>
                • Python 3.11+<br>
                • PostgreSQL 14+<br>
                • AWS Account (for S3)</p>

                <h3>Backend Setup</h3>
                <p style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 10px;">
                    <code>git clone https://github.com/sapkota-aayush/dumps.git</code><br>
                    <code>cd dumps/backend</code><br>
                    <code>python3 -m venv venv</code><br>
                    <code>source venv/bin/activate</code><br>
                    <code>pip install -r ../requirements.txt</code><br>
                    <code>alembic upgrade head</code><br>
                    <code>uvicorn app.main:app --reload</code>
                </p>

                <h3>Frontend Setup</h3>
                <p style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 10px;">
                    <code>cd frontend/dumpster-dove</code><br>
                    <code>npm install</code><br>
                    <code>npm run dev</code>
                </p>
            </div>

            <div class="cta-section">
                <h2 style="color: white; margin-bottom: 10px;">🌟 Experience It Live</h2>
                <p style="font-size: 1.2em; opacity: 0.95;">Join thousands of SLC students sharing their journey anonymously</p>
                <div class="cta-buttons">
                    <a href="https://dumps.online" class="btn btn-primary" target="_blank">🚀 Visit Live Site</a>
                    <a href="https://github.com/sapkota-aayush/dumps" class="btn btn-secondary" target="_blank">⭐ Star on GitHub</a>
                </div>
            </div>
        </div>

        <div class="footer">
            <h3>👤 Created by Aayush Sapkota</h3>
            <div class="footer-links">
                <a href="https://github.com/sapkota-aayush">GitHub</a>
                <a href="https://dumps.online">Website</a>
                <a href="mailto:support@dumps.online">Contact</a>
            </div>
            <p style="margin-top: 30px; opacity: 0.7;">Made with ❤️ for anonymous expression and SLC students everywhere</p>
            <p style="margin-top: 10px; opacity: 0.5; font-size: 0.9em;">© 2024 Dumps.online. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
