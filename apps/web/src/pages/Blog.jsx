import { Link } from "react-router-dom";

export default function Blog() {
  return (
    <>
      {" "}
      <section
        className="flat-title-page"
        style={{ backgroundImage: "url(/images/page-title/page-title-2.jpg)" }}
      >
        {" "}
        <div className="container">
          {" "}
          <div className="breadcrumb-content">
            {" "}
            <ul className="breadcrumb">
              <li>
                <Link to="/" className="text-white">
                  Home
                </Link>
              </li>
              <li className="text-white">/ Pages</li>
              <li className="text-white">/ Latest News</li>
            </ul>{" "}
            <h1 className="text-center text-white title">Latest News</h1>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section">
        {" "}
        <div className="container">
          {" "}
          <div className="row">
            {" "}
            <div className="col-lg-8">
              {" "}
              <div className="flat-blog-list">
                {" "}
                <div className="flat-blog-item">
                  {" "}
                  <Link to="/blog-detail" className="img-style">
                    {" "}
                    <img src="/images/blog/blog-lg-1.jpg" alt="img-blog" />{" "}
                  </Link>{" "}
                  <div className="content-box">
                    {" "}
                    <h5 className="title text-black-2">
                      <Link to="/blog-detail" className="link">
                        Building gains into housing stocks and how to trade the
                        sector
                      </Link>{" "}
                    </h5>{" "}
                    <div className="post-author d-flex align-items-center">
                      {" "}
                      <span className="text-primary fw-6 d-inline-flex align-items-center">
                        {" "}
                        <svg
                          className="icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {" "}
                          <path
                            d="M1.5 8.5V8C1.5 7.60218 1.65804 7.22064 1.93934 6.93934C2.22064 6.65804 2.60218 6.5 3 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8V8.5M8.70667 4.20667L7.29333 2.79333C7.20048 2.70037 7.09022 2.62661 6.96886 2.57628C6.84749 2.52595 6.71739 2.50003 6.586 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V12C1.5 12.3978 1.65804 12.7794 1.93934 13.0607C2.22064 13.342 2.60218 13.5 3 13.5H13C13.3978 13.5 13.7794 13.342 14.0607 13.0607C14.342 12.7794 14.5 12.3978 14.5 12V6C14.5 5.60218 14.342 5.22064 14.0607 4.93934C13.7794 4.65804 13.3978 4.5 13 4.5H9.414C9.14887 4.49977 8.89402 4.39426 8.70667 4.20667Z"
                            stroke="#A3ABB0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                        Furniture{" "}
                      </span>{" "}
                      <span className="fw-6 text-variant-1">
                        January 30
                      </span>{" "}
                    </div>{" "}
                    <p className="description">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin posuere est eget lorem viverra eleifend.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas...
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flat-blog-item">
                  {" "}
                  <Link to="/blog-detail" className="img-style">
                    {" "}
                    <img src="/images/blog/blog-lg-2.jpg" alt="img-blog" />{" "}
                  </Link>{" "}
                  <div className="content-box">
                    {" "}
                    <h5 className="title text-black-2">
                      <Link to="/blog-detail" className="link">
                        92% of millennial homebuyers say inflation has impacted
                        their plans
                      </Link>
                    </h5>{" "}
                    <div className="post-author d-flex align-items-center">
                      {" "}
                      <span className="text-primary fw-6 d-inline-flex align-items-center">
                        {" "}
                        <svg
                          className="icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {" "}
                          <path
                            d="M1.5 8.5V8C1.5 7.60218 1.65804 7.22064 1.93934 6.93934C2.22064 6.65804 2.60218 6.5 3 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8V8.5M8.70667 4.20667L7.29333 2.79333C7.20048 2.70037 7.09022 2.62661 6.96886 2.57628C6.84749 2.52595 6.71739 2.50003 6.586 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V12C1.5 12.3978 1.65804 12.7794 1.93934 13.0607C2.22064 13.342 2.60218 13.5 3 13.5H13C13.3978 13.5 13.7794 13.342 14.0607 13.0607C14.342 12.7794 14.5 12.3978 14.5 12V6C14.5 5.60218 14.342 5.22064 14.0607 4.93934C13.7794 4.65804 13.3978 4.5 13 4.5H9.414C9.14887 4.49977 8.89402 4.39426 8.70667 4.20667Z"
                            stroke="#A3ABB0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                        Furniture{" "}
                      </span>{" "}
                      <span className="fw-6 text-variant-1">
                        January 30
                      </span>{" "}
                    </div>{" "}
                    <p className="description">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin posuere est eget lorem viverra eleifend.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas...
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flat-blog-item">
                  {" "}
                  <Link to="/blog-detail" className="img-style">
                    {" "}
                    <img src="/images/blog/blog-lg-3.jpg" alt="img-blog" />{" "}
                  </Link>{" "}
                  <div className="content-box">
                    {" "}
                    <h5 className="title text-black-2">
                      <Link to="/blog-detail" className="link">
                        Building gains into housing stocks and how to trade the
                        sector
                      </Link>{" "}
                    </h5>{" "}
                    <div className="post-author d-flex align-items-center">
                      {" "}
                      <span className="text-primary fw-6 d-inline-flex align-items-center">
                        {" "}
                        <svg
                          className="icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {" "}
                          <path
                            d="M1.5 8.5V8C1.5 7.60218 1.65804 7.22064 1.93934 6.93934C2.22064 6.65804 2.60218 6.5 3 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8V8.5M8.70667 4.20667L7.29333 2.79333C7.20048 2.70037 7.09022 2.62661 6.96886 2.57628C6.84749 2.52595 6.71739 2.50003 6.586 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V12C1.5 12.3978 1.65804 12.7794 1.93934 13.0607C2.22064 13.342 2.60218 13.5 3 13.5H13C13.3978 13.5 13.7794 13.342 14.0607 13.0607C14.342 12.7794 14.5 12.3978 14.5 12V6C14.5 5.60218 14.342 5.22064 14.0607 4.93934C13.7794 4.65804 13.3978 4.5 13 4.5H9.414C9.14887 4.49977 8.89402 4.39426 8.70667 4.20667Z"
                            stroke="#A3ABB0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                        Furniture{" "}
                      </span>{" "}
                      <span className="fw-6 text-variant-1">
                        January 30
                      </span>{" "}
                    </div>{" "}
                    <p className="description">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin posuere est eget lorem viverra eleifend.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas...
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flat-blog-item">
                  {" "}
                  <Link to="/blog-detail" className="img-style">
                    {" "}
                    <img src="/images/blog/blog-lg-4.jpg" alt="img-blog" />{" "}
                  </Link>{" "}
                  <div className="content-box">
                    {" "}
                    <h5 className="title text-black-2">
                      <Link to="/blog-detail" className="link">
                        The Art of Staging: How to Sell Your Home Quickly at a
                        High Price.
                      </Link>{" "}
                    </h5>{" "}
                    <div className="post-author d-flex align-items-center">
                      {" "}
                      <span className="text-primary fw-6 d-inline-flex align-items-center">
                        {" "}
                        <svg
                          className="icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {" "}
                          <path
                            d="M1.5 8.5V8C1.5 7.60218 1.65804 7.22064 1.93934 6.93934C2.22064 6.65804 2.60218 6.5 3 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8V8.5M8.70667 4.20667L7.29333 2.79333C7.20048 2.70037 7.09022 2.62661 6.96886 2.57628C6.84749 2.52595 6.71739 2.50003 6.586 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V12C1.5 12.3978 1.65804 12.7794 1.93934 13.0607C2.22064 13.342 2.60218 13.5 3 13.5H13C13.3978 13.5 13.7794 13.342 14.0607 13.0607C14.342 12.7794 14.5 12.3978 14.5 12V6C14.5 5.60218 14.342 5.22064 14.0607 4.93934C13.7794 4.65804 13.3978 4.5 13 4.5H9.414C9.14887 4.49977 8.89402 4.39426 8.70667 4.20667Z"
                            stroke="#A3ABB0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                        Furniture{" "}
                      </span>{" "}
                      <span className="fw-6 text-variant-1">
                        January 30
                      </span>{" "}
                    </div>{" "}
                    <p className="description">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin posuere est eget lorem viverra eleifend.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas...
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flat-blog-item">
                  {" "}
                  <Link to="/blog-detail" className="img-style">
                    {" "}
                    <img src="/images/blog/blog-lg-5.jpg" alt="img-blog" />{" "}
                  </Link>{" "}
                  <div className="content-box">
                    {" "}
                    <h5 className="title text-black-2">
                      <Link to="/blog-detail" className="link">
                        Building gains into housing stocks and how to trade the
                        sector
                      </Link>{" "}
                    </h5>{" "}
                    <div className="post-author d-flex align-items-center">
                      {" "}
                      <span className="text-primary fw-6 d-inline-flex align-items-center">
                        {" "}
                        <svg
                          className="icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {" "}
                          <path
                            d="M1.5 8.5V8C1.5 7.60218 1.65804 7.22064 1.93934 6.93934C2.22064 6.65804 2.60218 6.5 3 6.5H13C13.3978 6.5 13.7794 6.65804 14.0607 6.93934C14.342 7.22064 14.5 7.60218 14.5 8V8.5M8.70667 4.20667L7.29333 2.79333C7.20048 2.70037 7.09022 2.62661 6.96886 2.57628C6.84749 2.52595 6.71739 2.50003 6.586 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V12C1.5 12.3978 1.65804 12.7794 1.93934 13.0607C2.22064 13.342 2.60218 13.5 3 13.5H13C13.3978 13.5 13.7794 13.342 14.0607 13.0607C14.342 12.7794 14.5 12.3978 14.5 12V6C14.5 5.60218 14.342 5.22064 14.0607 4.93934C13.7794 4.65804 13.3978 4.5 13 4.5H9.414C9.14887 4.49977 8.89402 4.39426 8.70667 4.20667Z"
                            stroke="#A3ABB0"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </svg>{" "}
                        Furniture{" "}
                      </span>{" "}
                      <span className="fw-6 text-variant-1">
                        January 30
                      </span>{" "}
                    </div>{" "}
                    <p className="description">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Proin posuere est eget lorem viverra eleifend.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas...
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <ul className="justify-content-center wd-navigation">
                <li>
                  <a href="#" className="nav-item">
                    <i className="icon icon-arr-l"></i>
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item">
                    1
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item">
                    2
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item active">
                    3
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item">
                    4
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item">
                    ...
                  </a>
                </li>
                <li>
                  <a href="#" className="nav-item">
                    <i className="icon icon-arr-r"></i>
                  </a>
                </li>
              </ul>{" "}
            </div>{" "}
            <div className="col-lg-4">
              {" "}
              <aside className="sidebar-blog fixed-sidebar">
                {" "}
                <div className="widget-search">
                  {" "}
                  <h5 className="text-black-2 text-capitalize">
                    Search Blog
                  </h5>{" "}
                  <div className="search-box">
                    {" "}
                    <input
                      className="search-field"
                      type="text"
                      placeholder="Search..."
                    />{" "}
                    <a href="#" className="icon icon-search"></a>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="widget-box categories">
                  {" "}
                  <h5 className="text-black-2 text-capitalize">
                    Categories
                  </h5>{" "}
                  <ul className="mt-20">
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Market Updates</span>
                        <span>(50)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Buying Tips</span>
                        <span>(34)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Interior Inspiration</span>
                        <span>(69)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Investment Insights</span>
                        <span>(25)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Home Construction</span>
                        <span>(12)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Legal Guidance</span>
                        <span>(12)</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="categories-item link">
                        <span>Community Spotlight</span>
                        <span>(69)</span>
                      </a>
                    </li>
                  </ul>{" "}
                </div>{" "}
                <div className="widget-box recent">
                  {" "}
                  <h5 className="text-black-2 text-capitalize">
                    Featured listings
                  </h5>{" "}
                  <ul>
                    <li>
                      {" "}
                      <div className="recent-post-item not-overlay hover-img">
                        {" "}
                        <a href="blog-detail" className="img-style">
                          {" "}
                          <img
                            src="/images/blog/post-recent-1.jpg"
                            alt="post-recent"
                          />{" "}
                        </a>{" "}
                        <div className="content">
                          {" "}
                          <a href="blog-detail" className="title link">
                            Key Real Estate Trends to Watch in 2024
                          </a>{" "}
                          <div className="subtitle">
                            {" "}
                            <svg
                              width="16"
                              height="17"
                              viewBox="0 0 16 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {" "}
                              <path
                                d="M4.5 2.5V4M11.5 2.5V4M2 13V5.5C2 5.10218 2.15804 4.72064 2.43934 4.43934C2.72064 4.15804 3.10218 4 3.5 4H12.5C12.8978 4 13.2794 4.15804 13.5607 4.43934C13.842 4.72064 14 5.10218 14 5.5V13M2 13C2 13.3978 2.15804 13.7794 2.43934 14.0607C2.72064 14.342 3.10218 14.5 3.5 14.5H12.5C12.8978 14.5 13.2794 14.342 13.5607 14.0607C13.842 13.7794 14 13.3978 14 13M2 13V8C2 7.60218 2.15804 7.22064 2.43934 6.93934C2.72064 6.65804 3.10218 6.5 3.5 6.5H12.5C12.8978 6.5 13.2794 6.65804 13.5607 6.93934C13.842 7.22064 14 7.60218 14 8V13"
                                stroke="#7C818B"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />{" "}
                            </svg>{" "}
                            <span>February 16, 2024</span>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                    </li>
                    <li>
                      {" "}
                      <div className="recent-post-item not-overlay hover-img">
                        {" "}
                        <a href="blog-detail" className="img-style">
                          {" "}
                          <img
                            src="/images/blog/post-recent-2.jpg"
                            alt="post-recent"
                          />{" "}
                        </a>{" "}
                        <div className="content">
                          {" "}
                          <a href="blog-detail" className="title link">
                            Expert Tips for Profitable Real Estate Investments.
                          </a>{" "}
                          <div className="subtitle">
                            {" "}
                            <svg
                              width="16"
                              height="17"
                              viewBox="0 0 16 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {" "}
                              <path
                                d="M4.5 2.5V4M11.5 2.5V4M2 13V5.5C2 5.10218 2.15804 4.72064 2.43934 4.43934C2.72064 4.15804 3.10218 4 3.5 4H12.5C12.8978 4 13.2794 4.15804 13.5607 4.43934C13.842 4.72064 14 5.10218 14 5.5V13M2 13C2 13.3978 2.15804 13.7794 2.43934 14.0607C2.72064 14.342 3.10218 14.5 3.5 14.5H12.5C12.8978 14.5 13.2794 14.342 13.5607 14.0607C13.842 13.7794 14 13.3978 14 13M2 13V8C2 7.60218 2.15804 7.22064 2.43934 6.93934C2.72064 6.65804 3.10218 6.5 3.5 6.5H12.5C12.8978 6.5 13.2794 6.65804 13.5607 6.93934C13.842 7.22064 14 7.60218 14 8V13"
                                stroke="#7C818B"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />{" "}
                            </svg>{" "}
                            <span>February 16, 2024</span>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                    </li>
                    <li>
                      {" "}
                      <div className="recent-post-item not-overlay hover-img">
                        {" "}
                        <a href="blog-detail" className="img-style">
                          {" "}
                          <img
                            src="/images/blog/post-recent-3.jpg"
                            alt="post-recent"
                          />{" "}
                        </a>{" "}
                        <div className="content">
                          {" "}
                          <a href="blog-detail" className="title link">
                            10 Steps to Prepare for a Successful Real Estate...
                          </a>{" "}
                          <div className="subtitle">
                            {" "}
                            <svg
                              width="16"
                              height="17"
                              viewBox="0 0 16 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {" "}
                              <path
                                d="M4.5 2.5V4M11.5 2.5V4M2 13V5.5C2 5.10218 2.15804 4.72064 2.43934 4.43934C2.72064 4.15804 3.10218 4 3.5 4H12.5C12.8978 4 13.2794 4.15804 13.5607 4.43934C13.842 4.72064 14 5.10218 14 5.5V13M2 13C2 13.3978 2.15804 13.7794 2.43934 14.0607C2.72064 14.342 3.10218 14.5 3.5 14.5H12.5C12.8978 14.5 13.2794 14.342 13.5607 14.0607C13.842 13.7794 14 13.3978 14 13M2 13V8C2 7.60218 2.15804 7.22064 2.43934 6.93934C2.72064 6.65804 3.10218 6.5 3.5 6.5H12.5C12.8978 6.5 13.2794 6.65804 13.5607 6.93934C13.842 7.22064 14 7.60218 14 8V13"
                                stroke="#7C818B"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />{" "}
                            </svg>{" "}
                            <span>February 16, 2024</span>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                    </li>
                  </ul>{" "}
                </div>{" "}
                <div className="widget-box newsletter">
                  {" "}
                  <h5 className="text-black-2 text-capitalize">
                    Join our newsletter
                  </h5>{" "}
                  <p className="caption-2 text-variant-1 mt-20">
                    Signup to be the first to hear about exclusive deals,
                    special offers and upcoming collections
                  </p>{" "}
                  <div className="search-box mt-20">
                    {" "}
                    <input
                      className="search-field"
                      type="text"
                      placeholder="Enter your email"
                    />{" "}
                    <a href="#" className="icon">
                      {" "}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M4.00035 7.99998L2.17969 2.08398C6.53489 3.35043 10.6419 5.35118 14.3237 7.99998C10.6422 10.6492 6.53541 12.6504 2.18035 13.9173L4.00035 7.99998ZM4.00035 7.99998H9.00035"
                          stroke="#1563DF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />{" "}
                      </svg>{" "}
                    </a>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="widget-box tag">
                  {" "}
                  <h5 className="text-black-2 text-capitalize">
                    Popular Tag
                  </h5>{" "}
                  <ul className="mt-20">
                    <li>
                      <a href="#" className="tag-item">
                        Property
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Office
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Finance
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Legal
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Market
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Invest
                      </a>
                    </li>
                    <li>
                      <a href="#" className="tag-item">
                        Renovate
                      </a>
                    </li>
                  </ul>{" "}
                </div>{" "}
              </aside>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </>
  );
}
