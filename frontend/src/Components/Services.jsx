import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Services.css';
import Header from './Header';

const Services = () => {
    const services = [
        {
            title: 'Search Engine Optimization',
            description: "Boost your website's visibility on search engines and drive organic traffic.",
            imgSrc: 'SEO.jpg',
        },
        {
            title: 'Pay-Per-Click Advertising',
            description: 'Maximize your ROI with targeted ad campaigns across all platforms.',
            imgSrc: 'PPC.jpg',
        },
        {
            title: 'Social Media Management',
            description: 'Engage your audience and grow your brand through social media platforms.',
            imgSrc: 'SMM.jpg',
        },
        {
            title: 'Graphic Designing',
            description: 'Create visually stunning designs that captivate your audience.',
            imgSrc: '/images/graphic-design.jpg',
        },
        {
            title: 'Video Editing',
            description: 'Transform raw footage into professional-grade videos.',
            imgSrc: '/images/video-editing.jpg',
        },
        {
            title: '3D Modeling',
            description: 'Create realistic 3D models for various industries.',
            imgSrc: '/images/3d-modeling.jpg',
        },
        {
            title: 'Sculpting',
            description: 'Bring your ideas to life with digital or physical sculptures.',
            imgSrc: '/images/sculpting.jpg',
        },
    ];

    return (
        <>
            <Header />
            <section id="services" className="py-5 bg-light">
                <div className="container text-center">
                    <h2 className="mb-4 text-primary">Our Services</h2>
                    <p className="text-muted mb-5">
                        Discover a range of services designed to help your business succeed in the digital world.
                    </p>
                    <div className="row">
                        {services.map((service, index) => (
                            <div className="col-md-4 mb-4" key={index}>
                                <div className="card shadow border-0">
                                    <img src={service.imgSrc} alt={service.title} className="card-img-top" />
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{service.title}</h5>
                                        <p className="card-text text-muted">{service.description}</p>
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
