import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Header';

const About = () => {
    return (
        <>
            <Header />
            <div className="about-page bg-light py-5">
                <div className="container text-center">
                    <h1 className="mb-4 text-primary">About Us</h1>
                    <p className="mb-5 text-muted">
                        Welcome to our company! We are dedicated to providing top-notch services and building innovative solutions
                        for our clients. Meet our amazing team below.
                    </p>
                    <div className="row">
                        {/* Card 1 */}
                        <div className="col-md-4 mb-4">
                            <div className="card shadow-sm border-0">
                                <img
                                    src="https://via.placeholder.com/300"
                                    className="card-img-top"
                                    alt="Team Member"
                                />
                                <div className="card-body">
                                    <h5 className="card-title">John Doe</h5>
                                    <p className="card-text text-muted">CEO & Founder</p>
                                    <p className="card-text">
                                        John is a visionary leader with over 15 years of experience in the tech industry.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Card 2 */}
                        <div className="col-md-4 mb-4">
                            <div className="card shadow-sm border-0">
                                <img
                                    src="https://via.placeholder.com/300"
                                    className="card-img-top"
                                    alt="Team Member"
                                />
                                <div className="card-body">
                                    <h5 className="card-title">Jane Smith</h5>
                                    <p className="card-text text-muted">Lead Developer</p>
                                    <p className="card-text">
                                        Jane specializes in building scalable web applications and mentoring junior developers.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Card 3 */}
                        <div className="col-md-4 mb-4">
                            <div className="card shadow-sm border-0">
                                <img
                                    src="https://via.placeholder.com/300"
                                    className="card-img-top"
                                    alt="Team Member"
                                />
                                <div className="card-body">
                                    <h5 className="card-title">Sarah Lee</h5>
                                    <p className="card-text text-muted">Product Manager</p>
                                    <p className="card-text">
                                        Sarah ensures our products meet the highest standards and deliver great user experiences.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default About;
