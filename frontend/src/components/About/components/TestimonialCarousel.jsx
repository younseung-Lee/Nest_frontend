import React, { useState, useEffect, useRef } from 'react';
import './TestimonialCarousel.css';

const TestimonialCard = ({ content, author, role, rating = 5 }) => (
  <div className="testimonial-card">
    <div className="testimonial-rating">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
          ⭐
        </span>
      ))}
    </div>
    <p className="testimonial-content">"{content}"</p>
    <div className="testimonial-author">
      <strong>{author}</strong>
      <span className="author-role">{role}</span>
    </div>
  </div>
);

const TestimonialCarousel = ({ testimonials, autoPlay = true, interval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, testimonials.length, interval]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
  };

  return (
    <div 
      className="testimonial-carousel"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(autoPlay)}
    >
      <div className="carousel-container">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn prev" onClick={prevSlide}>
          ←
        </button>
        <div className="carousel-indicators">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
        <button className="carousel-btn next" onClick={nextSlide}>
          →
        </button>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
