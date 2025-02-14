import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Services.css';
import Header from './Header';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Services = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true
        });
    }, []);

    const services = [
        {
            title: 'Search Engine Optimization',
            description: "Boost your website's visibility on search engines and drive organic traffic.",
            imgSrc: '/SEO.jpg',
            icon: 'fas fa-search'
        },
        {
            title: 'Pay-Per-Click Advertising',
            description: 'Maximize your ROI with targeted ad campaigns across all platforms.',
            imgSrc: '/PPC.jpg',
            icon: 'fas fa-ad'
        },
        {
            title: 'Social Media Management',
            description: 'Engage your audience and grow your brand through social media platforms.',
            imgSrc: '/SMM.jpg',
            icon: 'fas fa-share-alt'
        },
        {
            title: 'Graphic Designing',
            description: 'Create visually stunning designs that captivate your audience.',
            imgSrc: '/digital.png',
            icon: 'fas fa-palette'
        },
        {
            title: 'Video Editing',
            description: 'Transform raw footage into professional-grade videos.',
            imgSrc: '/digital2.png',
            icon: 'fas fa-video'
        },
        {
            title: '3D Modeling',
            description: 'Create realistic 3D models for various industries.',
            imgSrc: '/digital.png',
            icon: 'fas fa-cube'
        },
        {
            title: 'Sculpting',
            description: 'Bring your ideas to life with digital or physical sculptures.',
            imgSrc: '/digital2.png',
            icon: 'fas fa-drafting-compass'
        },
    ];

    return (
        <>
            <Header />
            <section id="services" className="py-5 bg-light">
                <div className="container text-center">
                    <h2 className="mb-4 text-primary" data-aos="fade-up">Our Services</h2>
                    <p className="text-muted mb-5" data-aos="fade-up" data-aos-delay="100">
                        Discover a range of services designed to help your business succeed in the digital world.
                    </p>
                    <div className="row">
                        {services.map((service, index) => (
                            <div className="col-md-4 mb-4" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                                <div className="card service-card shadow border-0 h-100">
                                    <div className="card-img-wrapper">
                                        <img 
                                            src={service.imgSrc} 
                                            alt={service.title} 
                                            className="card-img-top"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/digital.png';
                                            }}
                                        />
                                        <div className="card-img-overlay d-flex align-items-center justify-content-center">
                                            <i className={`${service.icon} fa-3x text-white`}></i>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{service.title}</h5>
                                        <p className="card-text text-muted">{service.description}</p>
                                        <button className="btn btn-outline-primary mt-2">Learn More</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default Services;
