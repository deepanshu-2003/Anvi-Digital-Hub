import React from 'react';
import Header from './Header';

const Contact = () => {
    return (
        <>
            <Header />
            <div className="contact-page bg-light py-5">
                <div className="container">
                    <h1 className="text-center mb-4 text-primary">Contact Us</h1>
                    <p className="text-center text-muted mb-5">
                        Have questions? Feel free to reach out to us using the form below, or contact us directly through email or phone.
                    </p>

                    <div className="row">
                        {/* Contact Form */}
                        <div className="col-md-6 mb-4">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">Get In Touch</h5>
                                    <form>
                                        <div className="mb-3">
                                            <label htmlFor="name" className="form-label">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="message" className="form-label">
                                                Message
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="message"
                                                rows="4"
                                                placeholder="Type your message here..."
                                            ></textarea>
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100">
                                            Send Message
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="col-md-6">
                            <div className="card shadow border-0">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">Contact Information</h5>
                                    <p className="text-muted mb-1">
                                        <i className="bi bi-geo-alt-fill text-primary"></i> 123 Learning Street, Knowledge City
                                    </p>
                                    <p className="text-muted mb-1">
                                        <i className="bi bi-envelope-fill text-primary"></i> support@yourcompany.com
                                    </p>
                                    <p className="text-muted mb-3">
                                        <i className="bi bi-telephone-fill text-primary"></i> +1 (123) 456-7890
                                    </p>

                                    <h6 className="text-primary">Follow Us</h6>
                                    <div>
                                        <a href="#" className="text-primary me-3">
                                            <i className="bi bi-facebook"></i>
                                        </a>
                                        <a href="#" className="text-primary me-3">
                                            <i className="bi bi-twitter"></i>
                                        </a>
                                        <a href="#" className="text-primary me-3">
                                            <i className="bi bi-instagram"></i>
                                        </a>
                                        <a href="#" className="text-primary">
                                            <i className="bi bi-linkedin"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Contact;
