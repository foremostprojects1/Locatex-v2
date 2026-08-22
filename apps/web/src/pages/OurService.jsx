import { Link } from "react-router-dom";
import PartnerSection from "../components/sections/PartnerSection";

export default function OurService() {
  return (
    <>
      {" "}
      <section
        className="flat-title-page"
        style={{ backgroundImage: "url(/images/page-title/page-title-5.jpg)" }}
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
              <li className="text-white">/ Our Services</li>
            </ul>{" "}
            <h1 className="text-center text-white title">Our Services</h1>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section">
        {" "}
        <div className="container">
          {" "}
          <div
            className="box-title text-center wow fadeInUpSmall"
            data-wow-delay=".2s"
            data-wow-duration="2000ms"
          >
            {" "}
            <div className="text-subtitle text-primary">
              Explore Cities
            </div>{" "}
            <h3 className="title mt-4">Our Location For You</h3>{" "}
          </div>{" "}
          <div
            className="tf-grid-layout md-col-3 wow fadeInUpSmall"
            data-wow-delay=".4s"
            data-wow-duration="2000ms"
          >
            {" "}
            <div className="box-service">
              {" "}
              <div className="image">
                {" "}
                <img
                  src="/images/service/home-1.png"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h5 className="title">Buy A New Home</h5>{" "}
                <p className="description">
                  Discover your dream home effortlessly. Explore diverse
                  properties and expert guidance for a seamless buying
                  experience.
                </p>{" "}
                <Link to="/sidebar-grid" className="tf-btn btn-line">
                  Learn More <span className="icon icon-arrow-right2"></span>
                </Link>{" "}
              </div>{" "}
            </div>{" "}
            <div className="box-service">
              {" "}
              <div className="image">
                {" "}
                <img
                  src="/images/service/home-2.png"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h5 className="title">Sell a home</h5>{" "}
                <p className="description">
                  Sell confidently with expert guidance and effective
                  strategies, showcasing your property's best features for a
                  successful sale.
                </p>{" "}
                <Link to="/sidebar-grid" className="tf-btn btn-line">
                  Learn More <span className="icon icon-arrow-right2"></span>
                </Link>{" "}
              </div>{" "}
            </div>{" "}
            <div className="box-service">
              {" "}
              <div className="image">
                {" "}
                <img
                  src="/images/service/home-3.png"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h5 className="title">Rent a home</h5>{" "}
                <p className="description">
                  Discover your perfect rental effortlessly. Explore a diverse
                  variety of listings tailored precisely to suit your unique
                  lifestyle needs.
                </p>{" "}
                <Link to="/sidebar-grid" className="tf-btn btn-line">
                  Learn More <span className="icon icon-arrow-right2"></span>
                </Link>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <PartnerSection showPagination />{" "}
      <section className="flat-section bg-primary-new flat-testimonial">
        {" "}
        <div className="box-title px-15">
          {" "}
          <div
            className="text-center wow fadeInUpSmall"
            data-wow-delay=".2s"
            data-wow-duration="2000ms"
          >
            {" "}
            <div className="text-subtitle text-primary">
              Our Testimonials
            </div>{" "}
            <h3 className="title mt-4">What’s people say’s</h3>{" "}
            <p className="desc text-variant-1">
              Our seasoned team excels in real estate with years of successful
              market navigation, offering informed decisions and optimal
              results.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div
          dir="ltr"
          className="swiper tf-sw-testimonial"
          data-preview="4.5"
          data-tablet="2"
          data-mobile-sm="2"
          data-mobile="1"
          data-space="15"
          data-space-md="30"
          data-space-lg="30"
          data-centered="true"
          data-loop="true"
        >
          {" "}
          <div className="swiper-wrapper">
            {" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png1.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Courtney Henry</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png2.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Esther Howard</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png4.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Annette Black</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png6.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Bessie Cooper</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png3.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Courtney Henry</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="swiper-slide">
              {" "}
              <div
                className="box-tes-item wow fadeIn"
                data-wow-delay=".2s"
                data-wow-duration="2000ms"
              >
                {" "}
                <span className="icon icon-quote"></span>{" "}
                <p className="note body-2">
                  {" "}
                  "My experience with property management services has exceeded
                  expectations. They efficiently manage properties with a
                  professional and attentive approach in every situation. I feel
                  reassured that any issue will be resolved promptly and
                  effectively."{" "}
                </p>{" "}
                <div className="box-avt d-flex align-items-center gap-12">
                  {" "}
                  <div className="avatar avt-60 round">
                    {" "}
                    <img src="/images/avatar/avt-png5.png" alt="avatar" />{" "}
                  </div>{" "}
                  <div className="info">
                    {" "}
                    <h6>Courtney Henry</h6>{" "}
                    <p className="caption-2 text-variant-1 mt-4">
                      CEO Themesflat
                    </p>{" "}
                    <ul className="list-star">
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                      <li className="icon icon-star"></li>
                    </ul>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="sw-pagination sw-pagination-testimonial text-center"></div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section">
        {" "}
        <div className="container">
          {" "}
          <div className="tf-faq">
            {" "}
            <div
              className="box-title style-1 text-center wow fadeInUpSmall"
              data-wow-delay=".2s"
              data-wow-duration="2000ms"
            >
              {" "}
              <div className="text-subtitle text-primary">Faqs</div>{" "}
              <h3 className="title mt-4">Frequently Asked Questions</h3>{" "}
            </div>{" "}
            <ul className="box-faq" id="wrapper-faq">
              <li className="faq-item">
                {" "}
                <a
                  href="#accordion-faq-one"
                  className="faq-header collapsed"
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls="accordion-faq-one"
                >
                  {" "}
                  Why should I use your services?{" "}
                </a>{" "}
                <div
                  id="accordion-faq-one"
                  className="collapse"
                  data-bs-parent="#wrapper-faq"
                >
                  {" "}
                  <p className="faq-body">
                    {" "}
                    Once your account is set up and you've familiarized yourself
                    with the platform, you are ready to start using our
                    services. Whether it's accessing specific features, making
                    transactions, or utilizing our tools, you'll find everything
                    you need at your fingertips.{" "}
                  </p>{" "}
                </div>{" "}
              </li>
              <li className="faq-item active">
                {" "}
                <a
                  href="#accordion-faq-two"
                  className="faq-header"
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls="accordion-faq-two"
                >
                  {" "}
                  How do I get started with your services?{" "}
                </a>{" "}
                <div
                  id="accordion-faq-two"
                  className="collapse show"
                  data-bs-parent="#wrapper-faq"
                >
                  {" "}
                  <p className="faq-body">
                    {" "}
                    Once your account is set up and you've familiarized yourself
                    with the platform, you are ready to start using our
                    services. Whether it's accessing specific features, making
                    transactions, or utilizing our tools, you'll find everything
                    you need at your fingertips.{" "}
                  </p>{" "}
                </div>{" "}
              </li>
              <li className="faq-item">
                {" "}
                <a
                  href="#accordion-faq-three"
                  className="faq-header collapsed"
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls="accordion-faq-three"
                >
                  {" "}
                  How secure are your services?{" "}
                </a>{" "}
                <div
                  id="accordion-faq-three"
                  className="collapse"
                  data-bs-parent="#wrapper-faq"
                >
                  {" "}
                  <p className="faq-body">
                    {" "}
                    Once your account is set up and you've familiarized yourself
                    with the platform, you are ready to start using our
                    services. Whether it's accessing specific features, making
                    transactions, or utilizing our tools, you'll find everything
                    you need at your fingertips.{" "}
                  </p>{" "}
                </div>{" "}
              </li>
              <li className="faq-item">
                {" "}
                <a
                  href="#accordion-faq-four"
                  className="faq-header collapsed"
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls="accordion-faq-four"
                >
                  {" "}
                  Is there customer support available?{" "}
                </a>{" "}
                <div
                  id="accordion-faq-four"
                  className="collapse"
                  data-bs-parent="#wrapper-faq"
                >
                  {" "}
                  <p className="faq-body">
                    {" "}
                    Once your account is set up and you've familiarized yourself
                    with the platform, you are ready to start using our
                    services. Whether it's accessing specific features, making
                    transactions, or utilizing our tools, you'll find everything
                    you need at your fingertips.{" "}
                  </p>{" "}
                </div>{" "}
              </li>
              <li className="faq-item">
                {" "}
                <a
                  href="#accordion-faq-five"
                  className="faq-header collapsed"
                  data-bs-toggle="collapse"
                  aria-expanded="false"
                  aria-controls="accordion-faq-five"
                >
                  {" "}
                  How can I update my account information?{" "}
                </a>{" "}
                <div
                  id="accordion-faq-five"
                  className="collapse"
                  data-bs-parent="#wrapper-faq"
                >
                  {" "}
                  <p className="faq-body">
                    {" "}
                    Once your account is set up and you've familiarized yourself
                    with the platform, you are ready to start using our
                    services. Whether it's accessing specific features, making
                    transactions, or utilizing our tools, you'll find everything
                    you need at your fingertips.{" "}
                  </p>{" "}
                </div>{" "}
              </li>
            </ul>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section
        className="flat-section pt-0 flat-banner wow fadeInUpSmall"
        data-wow-delay=".2s"
        data-wow-duration="2000ms"
      >
        {" "}
        <div className="container">
          {" "}
          <div className="wrap-banner bg-primary-new">
            {" "}
            <div className="box-left">
              {" "}
              <div className="box-title">
                {" "}
                <div className="text-subtitle text-primary">
                  Become Partners
                </div>{" "}
                <h3 className="mt-4 fw-8">
                  List your Properties on LocateX, join Us Now!
                </h3>{" "}
              </div>{" "}
              <Link
                to="/contact"
                className="tf-btn btn-view primary size-1 hover-btn-view"
              >
                Become A Hosting{" "}
                <span className="icon icon-arrow-right2"></span>
              </Link>{" "}
            </div>{" "}
            <div className="box-right">
              {" "}
              <img src="/images/banner/banner.png" alt="image" />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </>
  );
}
