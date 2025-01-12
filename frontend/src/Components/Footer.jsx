import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-dark text-light py-4">
            <div className="container">
                <div className="row">
                    {/* About Section */}
                    <div className="col-md-4 mb-3">
                        <h5 className="text-uppercase text-primary">About Us</h5>
                        <p className="small">
                            We provide high-quality online courses to help you achieve your career goals. Join us to learn
                            the latest technologies and boost your skills.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="col-md-4 mb-3">
                        <h5 className="text-uppercase text-primary">Quick Links</h5>
                        <ul className="list-unstyled">
                            <li>
                                <a href="/about" className="text-light text-decoration-none">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="/courses" className="text-light text-decoration-none">
                                    Courses
                                </a>
                            </li>
                            <li>
                                <a href="/contact" className="text-light text-decoration-none">
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a href="/faq" className="text-light text-decoration-none">
                                    FAQ
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="col-md-4 mb-3">
                        <h5 className="text-uppercase text-primary">Contact Us</h5>
                        <p className="small mb-1">
                            <i className="bi bi-geo-alt-fill text-primary"></i> 123 Learning Street, Knowledge City
                        </p>
                        <p className="small mb-1">
                            <i className="bi bi-envelope-fill text-primary"></i> support@courses.com
                        </p>
                        <p className="small mb-1">
                            <i className="bi bi-telephone-fill text-primary"></i> +1 (123) 456-7890
                        </p>
                    </div>
                </div>

                <hr className="bg-secondary" />

                {/* Social Media Links */}
                <div className="text-center">
                    <a href="#" className="text-light mx-2 text-decoration-none">
                        <i className="bi bi-facebook"></i>
                    </a>
                    <a href="#" className="text-light mx-2 text-decoration-none">
                        <i className="bi bi-twitter"></i>
                    </a>
                    <a href="#" className="text-light mx-2 text-decoration-none">
                        <i className="bi bi-instagram"></i>
                    </a>
                    <a href="#" className="text-light mx-2 text-decoration-none">
                        <i className="bi bi-linkedin"></i>
                    </a>
                </div>

                {/* Copyright */}
                <div className="text-center mt-3">
                    <small>&copy; 2024 Your Company. All Rights Reserved.</small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
