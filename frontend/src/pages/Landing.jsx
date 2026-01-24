import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="logo">
                        <span className="logo-icon">🧠</span>
                        <span className="logo-text">InventraAI</span>
                    </div>
                    <div className="nav-links">
                        <a href="#home">Home</a>
                        <a href="#about">About</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-login">Login</Link>
                        <Link to="/signup" className="btn-signup">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">🚀 AI-Powered Business Intelligence</div>
                    <h1>Transform Your Business with <span className="gradient-text">Intelligent Automation</span></h1>
                    <p className="hero-subtitle">
                        InventraAI combines ML-powered demand forecasting, smart inventory management,
                        and AI agents to help you make data-driven decisions and maximize profits.
                    </p>
                    <div className="hero-cta">
                        <Link to="/signup" className="btn-primary">Start Free Trial</Link>
                        <a href="#about" className="btn-secondary">Learn More →</a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">87%</span>
                            <span className="stat-label">Forecast Accuracy</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">40%</span>
                            <span className="stat-label">Cost Reduction</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">5x</span>
                            <span className="stat-label">Faster Decisions</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div className="dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="preview-content">
                            <div className="preview-card">
                                <div className="preview-icon">📊</div>
                                <div className="preview-text">Demand Forecast</div>
                                <div className="preview-bar"></div>
                            </div>
                            <div className="preview-card">
                                <div className="preview-icon">🤖</div>
                                <div className="preview-text">AI Inventory</div>
                                <div className="preview-bar green"></div>
                            </div>
                            <div className="preview-card">
                                <div className="preview-icon">💰</div>
                                <div className="preview-text">Sales Analytics</div>
                                <div className="preview-bar purple"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">WORKFLOW</span>
                        <h2>How InventraAI Works</h2>
                        <p>From data to decision in 4 simple steps</p>
                    </div>
                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">01</div>
                            <div className="step-icon">🔌</div>
                            <h3>Connect Data</h3>
                            <p>Upload your sales spreadsheets or connect your database directly to our secure platform.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">02</div>
                            <div className="step-icon">🧠</div>
                            <h3>Auto-Train</h3>
                            <p>Our AutoML engine analyzes your data and automatically trains & selects the best performing models.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">03</div>
                            <div className="step-icon">🚀</div>
                            <h3>Deploy</h3>
                            <p>Get instant access to predictions via our dashboard or integrate using the generated API.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">04</div>
                            <div className="step-icon">⚡</div>
                            <h3>Automate</h3>
                            <p>Let AI agents monitor stock, predict expiry, and generate orders 24/7.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Demo Section */}
            <section id="demo" className="demo-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">WATCH DEMO</span>
                        <h2>See InventraAI in Action</h2>
                        <p>Watch how our AI agents automate your inventory management</p>
                    </div>
                    <div className="video-wrapper">
                        <iframe
                            className="demo-video"
                            src="https://www.youtube.com/embed/s5wEj5061T8?si=HqS1v_ZpXqZqXqZq"
                            title="InventraAI Demo"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="about" className="about-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">FEATURES</span>
                        <h2>Why Choose InventraAI?</h2>
                        <p>Comprehensive AI-powered tools to automate your business operations</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3>ML Demand Forecasting</h3>
                            <p>Predict future demand with 87%+ accuracy using advanced machine learning models trained on your sales data.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3>8 AI Agents</h3>
                            <p>Stock Analysis, Expiry Prediction, Smart Ordering, Vendor Quotation, Local Trends, Demand Forecasting, Weekly Review, and Auto-ML Detector.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Auto ML Training</h3>
                            <p>Upload your data, we train 13+ models and automatically select the best one for your use case.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🛒</div>
                            <h3>Smart Ordering</h3>
                            <p>AI-generated purchase orders based on predictions, current stock, and upcoming local events.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Real-time Dashboard</h3>
                            <p>Beautiful, intuitive dashboards to monitor inventory health, sales, and AI insights at a glance.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3>Expiry Alerts</h3>
                            <p>Never lose money to expired stock. Get proactive alerts and AI-suggested actions for expiring items.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">PRICING</span>
                        <h2>Simple, Transparent Pricing</h2>
                        <p>Choose the plan that fits your business size</p>
                    </div>
                    <div className="pricing-grid">
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3>Starter</h3>
                                <div className="price">
                                    <span className="currency">₹</span>
                                    <span className="amount">0</span>
                                    <span className="period">/month</span>
                                </div>
                                <p className="pricing-desc">Perfect for small shops getting started</p>
                            </div>
                            <ul className="pricing-features">
                                <li>✓ Up to 100 products</li>
                                <li>✓ Basic demand forecasting</li>
                                <li>✓ Stock alerts</li>
                                <li>✓ 1 user</li>
                                <li>✓ Email support</li>
                            </ul>
                            <Link to="/signup" className="btn-pricing">Get Started Free</Link>
                        </div>
                        <div className="pricing-card featured">
                            <div className="popular-badge">MOST POPULAR</div>
                            <div className="pricing-header">
                                <h3>Professional</h3>
                                <div className="price">
                                    <span className="currency">₹</span>
                                    <span className="amount">999</span>
                                    <span className="period">/month</span>
                                </div>
                                <p className="pricing-desc">For growing businesses</p>
                            </div>
                            <ul className="pricing-features">
                                <li>✓ Unlimited products</li>
                                <li>✓ Advanced ML models</li>
                                <li>✓ 8 AI agents</li>
                                <li>✓ 5 users</li>
                                <li>✓ API access</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <Link to="/signup" className="btn-pricing primary">Start 14-Day Trial</Link>
                        </div>
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3>Enterprise</h3>
                                <div className="price">
                                    <span className="currency">₹</span>
                                    <span className="amount">4999</span>
                                    <span className="period">/month</span>
                                </div>
                                <p className="pricing-desc">For large operations</p>
                            </div>
                            <ul className="pricing-features">
                                <li>✓ Everything in Pro</li>
                                <li>✓ Custom ML models</li>
                                <li>✓ Multi-location support</li>
                                <li>✓ Unlimited users</li>
                                <li>✓ Dedicated account manager</li>
                                <li>✓ On-premise deployment</li>
                            </ul>
                            <a href="#contact" className="btn-pricing">Contact Sales</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="section-container">
                    <div className="contact-grid">
                        <div className="contact-info">
                            <span className="section-badge">CONTACT US</span>
                            <h2>Let's Talk About Your Business</h2>
                            <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                            <div className="contact-details">
                                <div className="contact-item">
                                    <span className="contact-icon">📧</span>
                                    <div>
                                        <h4>Email</h4>
                                        <p>support@inventra.ai</p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-icon">📱</span>
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <span className="contact-icon">📍</span>
                                    <div>
                                        <h4>Location</h4>
                                        <p>Mumbai, Maharashtra, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="contact-form-wrapper">
                            <form className="contact-form">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" placeholder="Your name" />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" placeholder="your@email.com" />
                                </div>
                                <div className="form-group">
                                    <label>Business Type</label>
                                    <select>
                                        <option>Select business type</option>
                                        <option>Retail Store</option>
                                        <option>Grocery / Kirana</option>
                                        <option>Restaurant</option>
                                        <option>Wholesale</option>
                                        <option>E-commerce</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea placeholder="Tell us about your needs..." rows="4"></textarea>
                                </div>
                                <button type="submit" className="btn-submit">Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-main">
                        <div className="footer-brand">
                            <div className="logo">
                                <span className="logo-icon">🧠</span>
                                <span className="logo-text">InventraAI</span>
                            </div>
                            <p>AI-powered inventory management and demand forecasting for modern businesses.</p>
                            <div className="social-links">
                                <a href="#">𝕏</a>
                                <a href="#">in</a>
                                <a href="#">📘</a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <a href="#about">Features</a>
                                <a href="#pricing">Pricing</a>
                                <a href="#">API Docs</a>
                                <a href="#">Changelog</a>
                            </div>
                            <div className="footer-column">
                                <h4>Company</h4>
                                <a href="#about">About Us</a>
                                <a href="#">Careers</a>
                                <a href="#">Blog</a>
                                <a href="#contact">Contact</a>
                            </div>
                            <div className="footer-column">
                                <h4>Legal</h4>
                                <a href="#">Privacy Policy</a>
                                <a href="#">Terms of Service</a>
                                <a href="#">Cookie Policy</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 InventraAI. All rights reserved.</p>
                        <p>Made with ❤️ in India</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
