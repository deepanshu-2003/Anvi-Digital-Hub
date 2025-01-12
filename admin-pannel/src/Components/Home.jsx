import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './Header';
import './Home.css';
import { Link } from 'react-router-dom';
import Services from './Services'; // Import the new Services component

const Home = () => {
    return (
        <div className="home-page">
            <Header />
            {/* Hero Section */}
            <section className="hero-section text-white text-center d-flex align-items-center position-relative" style={heroStyle}>
                <div className="container position-relative z-index-1">
                    <h1 className="display-4 mt-5 fw-bold">Empowering Your Digital Presence</h1>
                    <p className="lead mt-3">
                        Transform your business with cutting-edge digital marketing strategies. Let us help you grow.
                    </p>
                    <a href="#services" className="btn btn-primary btn-lg mt-4">Get Started</a>
                </div>
            </section>

            {/* Services Section */}
            {/* <Services /> */}
             {/* Use the Services component here */}

            {/* Call to Action Section */}
            <section className="cta-section text-white text-center py-5" style={ctaStyle}>
                <div className="container">
                    <h2 className="mb-3">Ready to Grow Your Business?</h2>
                    <Link to="/contact" className="btn btn-light btn-lg">Contact Us Today</Link>
                </div>
            </section>
            <footer />
        </div>
    );
};

// Inline Styles
const heroStyle = {
    background: 'url(/anvi_digital_hub.png) no-repeat center center/cover',
    minHeight: '60vh',
    position: 'relative',
};

const ctaStyle = {
    background: '#343a40',
};

export default Home;
