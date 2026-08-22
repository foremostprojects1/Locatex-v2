import AnimatedHeadline from "../components/common/AnimatedHeadline";
import { Link } from "react-router-dom";
import PropertyCard from "../components/common/PropertyCard";
import { PROPERTIES } from "../data/properties";
import NiceSelect from "../components/common/NiceSelect";
import RangeSliderWidget from "../components/common/RangeSliderWidget";
import PartnerSection from "../components/sections/PartnerSection";

export default function HomeV5() {
  return (
    <>
      {" "}
      <section className="flat-slider home-5">
        {" "}
        <div className="wrap-slider-swiper">
          {" "}
          <div dir="ltr" className="swiper-container thumbs-swiper-column">
            {" "}
            <div className="swiper-wrapper">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-img">
                  {" "}
                  <img src="/images/slider/slider-5.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-img">
                  {" "}
                  <img src="/images/slider/slider-5-1.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-img">
                  {" "}
                  <img src="/images/slider/slider-5-2.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-img">
                  {" "}
                  <img src="/images/slider/slider-5-3.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="box-content">
            {" "}
            <div className="container">
              {" "}
              <div className="row">
                {" "}
                <div className="col-lg-6">
                  {" "}
                  <div className="slider-content">
                    {" "}
                    <div className="heading">
                      {" "}
                      <h1
                        className="title-large title text-white wow fadeIn animationtext clip"
                        data-wow-delay=".2s"
                        data-wow-duration="2000ms"
                      >
                        {" "}
                        Indulge in Your <br />{" "}
                        <AnimatedHeadline
                          type="clip"
                          words={["Sanctuary", "Safe House"]}
                        />{" "}
                      </h1>{" "}
                      <p
                        className="subtitle text-white body-2 wow fadeInUp"
                        data-wow-delay=".2s"
                      >
                        Discover your private oasis at LocateX, where every
                        corner, from the spacious garden to the relaxing pool,
                        is crafted for your comfort and enjoyment.
                      </p>{" "}
                    </div>{" "}
                    <div className="wrap-search-link">
                      {" "}
                      <div className="categories-list style-2">
                        {" "}
                        <a href="#">
                          <i className="icon icon-house-fill"></i> Houses
                        </a>{" "}
                        <a href="#">
                          <i className="icon icon-villa-fill"></i> Villa
                        </a>{" "}
                        <a href="#">
                          <i className="icon icon-office-fill"></i> Office
                        </a>{" "}
                        <a href="#">
                          <i className="icon icon-apartment"></i> Apartments
                        </a>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="col-lg-6">
                  {" "}
                  <div className="swiper-container thumbs-swiper-column1 swiper-pagination5">
                    {" "}
                    <div className="swiper-wrapper">
                      {" "}
                      <div className="swiper-slide">
                        {" "}
                        <div className="image-detail">
                          {" "}
                          <img
                            src="/images/slider/slider-pagi.jpg"
                            alt="images"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="swiper-slide">
                        {" "}
                        <div className="image-detail">
                          {" "}
                          <img
                            src="/images/slider/slider-pagi2.jpg"
                            alt="images"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="swiper-slide">
                        {" "}
                        <div className="image-detail">
                          {" "}
                          <img
                            src="/images/slider/slider-pagi3.jpg"
                            alt="images"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="swiper-slide">
                        {" "}
                        <div className="image-detail">
                          {" "}
                          <img
                            src="/images/slider/slider-pagi4.jpg"
                            alt="images"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="overlay"></div>{" "}
      </section>{" "}
      <div className="flat-control-search abs">
        {" "}
        <div className="container">
          {" "}
          <div className="flat-tab flat-tab-form">
            {" "}
            <ul
              className="nav-tab-form style-1 justify-content-center"
              role="tablist"
            >
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#forRent"
                  className="nav-link-item active"
                  data-bs-toggle="tab"
                >
                  For Rent
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#forSale"
                  className="nav-link-item"
                  data-bs-toggle="tab"
                >
                  For Sale
                </a>{" "}
              </li>
            </ul>{" "}
            <div className="tab-content">
              {" "}
              <div className="tab-pane fade active show" role="tabpanel">
                {" "}
                <div className="form-sl">
                  {" "}
                  <form method="post">
                    {" "}
                    <div className="wd-find-select shadow-3">
                      {" "}
                      <div className="inner-group">
                        {" "}
                        <div className="form-group-1 search-form form-style">
                          {" "}
                          <label>Type</label>{" "}
                          <div className="group-select">
                            {" "}
                            <NiceSelect
                              options={[
                                { value: "", label: "All" },
                                { value: "villa", label: "Villa" },
                                { value: "studio", label: "Studio" },
                                { value: "office", label: "Office" },
                                { value: "house", label: "House" },
                              ]}
                              defaultValue=""
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="form-group-2 form-style">
                          {" "}
                          <label>Location</label>{" "}
                          <div className="group-ip">
                            {" "}
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search Location"
                              defaultValue=""
                              name="s"
                              title="Search for"
                              required
                            />{" "}
                            <a href="#" className="icon icon-location">
                              {" "}
                            </a>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="form-group-3 form-style">
                          {" "}
                          <label>Keyword</label>{" "}
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search Keyword."
                            defaultValue=""
                            name="s"
                            title="Search for"
                            required
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="box-btn-advanced">
                        {" "}
                        <div className="form-group-4 box-filter">
                          {" "}
                          <a className="tf-btn btn-line filter-advanced pull-right">
                            {" "}
                            <span className="text-1">Advanced</span>{" "}
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 22 22"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {" "}
                              <path
                                d="M5.5 12.375V3.4375M5.5 12.375C5.86467 12.375 6.21441 12.5199 6.47227 12.7777C6.73013 13.0356 6.875 13.3853 6.875 13.75C6.875 14.1147 6.73013 14.4644 6.47227 14.7223C6.21441 14.9801 5.86467 15.125 5.5 15.125M5.5 12.375C5.13533 12.375 4.78559 12.5199 4.52773 12.7777C4.26987 13.0356 4.125 13.3853 4.125 13.75C4.125 14.1147 4.26987 14.4644 4.52773 14.7223C4.78559 14.9801 5.13533 15.125 5.5 15.125M5.5 15.125V18.5625M16.5 12.375V3.4375M16.5 12.375C16.8647 12.375 17.2144 12.5199 17.4723 12.7777C17.7301 13.0356 17.875 13.3853 17.875 13.75C17.875 14.1147 17.7301 14.4644 17.4723 14.7223C17.2144 14.9801 16.8647 15.125 16.5 15.125M16.5 12.375C16.1353 12.375 15.7856 12.5199 15.5277 12.7777C15.2699 13.0356 15.125 13.3853 15.125 13.75C15.125 14.1147 15.2699 14.4644 15.5277 14.7223C15.7856 14.9801 16.1353 15.125 16.5 15.125M16.5 15.125V18.5625M11 6.875V3.4375M11 6.875C11.3647 6.875 11.7144 7.01987 11.9723 7.27773C12.2301 7.53559 12.375 7.88533 12.375 8.25C12.375 8.61467 12.2301 8.96441 11.9723 9.22227C11.7144 9.48013 11.3647 9.625 11 9.625M11 6.875C10.6353 6.875 10.2856 7.01987 10.0277 7.27773C9.76987 7.53559 9.625 7.88533 9.625 8.25C9.625 8.61467 9.76987 8.96441 10.0277 9.22227C10.2856 9.48013 10.6353 9.625 11 9.625M11 9.625V18.5625"
                                stroke="#161E2D"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />{" "}
                            </svg>{" "}
                          </a>{" "}
                        </div>{" "}
                        <button
                          type="submit"
                          className="tf-btn btn-search primary"
                        >
                          Search <i className="icon icon-search"></i>{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="wd-search-form">
                      {" "}
                      <div className="grid-2 group-box group-price">
                        {" "}
                        <RangeSliderWidget
                          title="Price:"
                          min={100}
                          max={650000}
                          start={[100, 650000]}
                          format={{ prefix: "$" }}
                          inputNames={["min-value", "max-value"]}
                        />{" "}
                        <RangeSliderWidget
                          title="Size:"
                          min={20}
                          max={2000}
                          start={[500, 1500]}
                          format={{ postfix: " SqFt" }}
                          inputNames={["min-value2", "max-value2"]}
                          valueClassName="fw-7"
                        />{" "}
                      </div>{" "}
                      <div className="grid-2 group-box">
                        {" "}
                        <div className="group-select grid-2">
                          {" "}
                          <div className="box-select">
                            {" "}
                            <label className="title-select fw-6">
                              Rooms
                            </label>{" "}
                            <NiceSelect
                              options={[
                                { value: "1", label: "1" },
                                { value: "2", label: "2" },
                                { value: "3", label: "3" },
                                { value: "4", label: "4" },
                                { value: "5", label: "5" },
                                { value: "6", label: "6" },
                                { value: "7", label: "7" },
                                { value: "8", label: "8" },
                                { value: "9", label: "9" },
                                { value: "10", label: "10" },
                              ]}
                              defaultValue="2"
                            />{" "}
                          </div>{" "}
                          <div className="box-select">
                            {" "}
                            <label className="title-select fw-6">
                              Bathrooms
                            </label>{" "}
                            <NiceSelect
                              options={[
                                { value: "1", label: "1" },
                                { value: "2", label: "2" },
                                { value: "3", label: "3" },
                                { value: "4", label: "4" },
                                { value: "5", label: "5" },
                                { value: "6", label: "6" },
                                { value: "7", label: "7" },
                                { value: "8", label: "8" },
                                { value: "9", label: "9" },
                                { value: "10", label: "10" },
                              ]}
                              defaultValue="2"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="group-select grid-2">
                          {" "}
                          <div className="box-select">
                            {" "}
                            <label className="title-select fw-6">
                              Bedrooms
                            </label>{" "}
                            <NiceSelect
                              options={[
                                { value: "1", label: "1" },
                                { value: "2", label: "2" },
                                { value: "3", label: "3" },
                                { value: "4", label: "4" },
                                { value: "5", label: "5" },
                                { value: "6", label: "6" },
                                { value: "7", label: "7" },
                                { value: "8", label: "8" },
                                { value: "9", label: "9" },
                                { value: "10", label: "10" },
                              ]}
                              defaultValue="2"
                            />{" "}
                          </div>{" "}
                          <div className="box-select">
                            {" "}
                            <label className="title-select fw-6">
                              Type
                            </label>{" "}
                            <NiceSelect
                              options={[
                                { value: "1", label: "1" },
                                { value: "2", label: "2" },
                                { value: "3", label: "3" },
                                { value: "4", label: "4" },
                                { value: "5", label: "5" },
                                { value: "6", label: "6" },
                                { value: "7", label: "7" },
                                { value: "8", label: "8" },
                                { value: "9", label: "9" },
                                { value: "10", label: "10" },
                              ]}
                              defaultValue="2"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="group-checkbox">
                        {" "}
                        <div className="text-1 text-black-2">
                          Amenities:
                        </div>{" "}
                        <div className="group-amenities grid-6">
                          {" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb1"
                                defaultChecked=""
                              />{" "}
                              <label
                                htmlFor="cb1"
                                className="text-cb-amenities"
                              >
                                Air Condition
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb2"
                              />{" "}
                              <label
                                htmlFor="cb2"
                                className="text-cb-amenities"
                              >
                                Cable TV
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb3"
                              />{" "}
                              <label
                                htmlFor="cb3"
                                className="text-cb-amenities"
                              >
                                Ceiling Height
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb4"
                              />{" "}
                              <label
                                htmlFor="cb4"
                                className="text-cb-amenities"
                              >
                                Fireplace
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb5"
                              />{" "}
                              <label
                                htmlFor="cb5"
                                className="text-cb-amenities"
                              >
                                Disabled Access
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb6"
                                defaultChecked=""
                              />{" "}
                              <label
                                htmlFor="cb6"
                                className="text-cb-amenities"
                              >
                                Elevator
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb7"
                              />{" "}
                              <label
                                htmlFor="cb7"
                                className="text-cb-amenities"
                              >
                                Fence
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb8"
                              />{" "}
                              <label
                                htmlFor="cb8"
                                className="text-cb-amenities"
                              >
                                Garden
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb9"
                                defaultChecked=""
                              />{" "}
                              <label
                                htmlFor="cb9"
                                className="text-cb-amenities"
                              >
                                Floor
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb10"
                              />{" "}
                              <label
                                htmlFor="cb10"
                                className="text-cb-amenities"
                              >
                                Furnishing
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb11"
                                defaultChecked=""
                              />{" "}
                              <label
                                htmlFor="cb11"
                                className="text-cb-amenities"
                              >
                                Garage
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb12"
                              />{" "}
                              <label
                                htmlFor="cb12"
                                className="text-cb-amenities"
                              >
                                Pet Friendly
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb13"
                              />{" "}
                              <label
                                htmlFor="cb13"
                                className="text-cb-amenities"
                              >
                                Heating
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb14"
                              />{" "}
                              <label
                                htmlFor="cb14"
                                className="text-cb-amenities"
                              >
                                Intercom
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb15"
                              />{" "}
                              <label
                                htmlFor="cb15"
                                className="text-cb-amenities"
                              >
                                Parking
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb16"
                              />{" "}
                              <label
                                htmlFor="cb16"
                                className="text-cb-amenities"
                              >
                                WiFi
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb17"
                              />{" "}
                              <label
                                htmlFor="cb17"
                                className="text-cb-amenities"
                              >
                                Renovation
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb18"
                              />{" "}
                              <label
                                htmlFor="cb18"
                                className="text-cb-amenities"
                              >
                                Security
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb19"
                              />{" "}
                              <label
                                htmlFor="cb19"
                                className="text-cb-amenities"
                              >
                                Swimming Pool
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                          <div className="box-amenities">
                            {" "}
                            <fieldset className="amenities-item">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb20"
                              />{" "}
                              <label
                                htmlFor="cb20"
                                className="text-cb-amenities"
                              >
                                Window Type
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb21"
                              />{" "}
                              <label
                                htmlFor="cb21"
                                className="text-cb-amenities"
                              >
                                Search property
                              </label>{" "}
                            </fieldset>{" "}
                            <fieldset className="amenities-item mt-16">
                              {" "}
                              <input
                                type="checkbox"
                                className="tf-checkbox style-1"
                                id="cb22"
                              />{" "}
                              <label
                                htmlFor="cb22"
                                className="text-cb-amenities"
                              >
                                Construction Year
                              </label>{" "}
                            </fieldset>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </form>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <section className="flat-spacing-service bg-primary-new">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">Our Services</div>{" "}
            <h3 className="mt-4 title">Welcome the HomeLengo</h3>{" "}
          </div>{" "}
          <div
            className="tf-grid-layout md-col-3 wow fadeInUp"
            data-wow-delay=".2s"
          >
            {" "}
            <div className="box-service border-0">
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
            <div className="box-service border-0">
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
            <div className="box-service border-0">
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
      <section className="flat-section flat-recommended">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">
              Featured Properties
            </div>{" "}
            <h3 className="title mt-4">
              Discover LocateX’s Finest Properties for Your Dream Home
            </h3>{" "}
          </div>{" "}
          <div
            className="flat-tab-recommended flat-animate-tab wow fadeInUp"
            data-wow-delay=".2s"
          >
            {" "}
            <ul
              className="nav-tab-recommended justify-content-md-center"
              role="tablist"
            >
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#viewAll"
                  className="nav-link-item"
                  data-bs-toggle="tab"
                >
                  View All
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#apartment"
                  className="nav-link-item  active"
                  data-bs-toggle="tab"
                >
                  Apartment
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a href="#villa" className="nav-link-item" data-bs-toggle="tab">
                  Villa
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#studio"
                  className="nav-link-item"
                  data-bs-toggle="tab"
                >
                  Studio
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a href="#house" className="nav-link-item" data-bs-toggle="tab">
                  House
                </a>{" "}
              </li>
              <li className="nav-tab-item" role="presentation">
                {" "}
                <a
                  href="#office"
                  className="nav-link-item"
                  data-bs-toggle="tab"
                >
                  Office
                </a>{" "}
              </li>
            </ul>{" "}
            <div className="tab-content">
              {" "}
              <div className="tab-pane" id="viewAll" role="tabpanel">
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[30]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[31]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[32]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[22]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[33]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[34]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div
                className="tab-pane active show"
                id="apartment"
                role="tabpanel"
              >
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[30]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[31]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[32]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[22]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[33]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[34]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div className="tab-pane" id="villa" role="tabpanel">
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[30]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[31]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[32]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[22]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[33]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[34]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div className="tab-pane" id="studio" role="tabpanel">
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[12]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[13]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[14]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[15]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[16]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[17]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div className="tab-pane" id="house" role="tabpanel">
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[12]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[13]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[14]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[15]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[16]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[17]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              <div className="tab-pane" id="office" role="tabpanel">
                {" "}
                <div className="row">
                  {" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[12]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[13]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[14]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[15]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[16]} />{" "}
                  </div>{" "}
                  <div className="col-xl-4 col-lg-6 col-md-6">
                    {" "}
                    <PropertyCard property={PROPERTIES[17]} />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="text-center">
                  {" "}
                  <Link
                    to="/sidebar-grid"
                    className="tf-btn btn-view primary size-1 hover-btn-view"
                  >
                    View All Properties{" "}
                    <span className="icon icon-arrow-right2"></span>
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="px-10">
        {" "}
        <div className="box-title text-center wow fadeInUp">
          {" "}
          <div className="text-subtitle text-primary">Explore Cities</div>{" "}
          <h3 className="mt-4 title">Our Location For You</h3>{" "}
        </div>{" "}
        <div className="wow fadeInUp" data-wow-delay=".2s">
          {" "}
          <div
            dir="ltr"
            className="swiper tf-sw-location"
            data-preview="6"
            data-tablet="3"
            data-mobile-sm="2"
            data-mobile="1"
            data-space-lg="8"
            data-space-md="8"
            data-space="8"
            data-pagination="1"
            data-pagination-sm="2"
            data-pagination-md="3"
            data-pagination-lg="3"
          >
            {" "}
            <div className="swiper-wrapper">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-1.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Naperville
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-2.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Pembroke Pines
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-3.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Toledo
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-4.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Orange
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-5.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Fairfield
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-6.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Naperville
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-location">
                  {" "}
                  <Link to="/topmap-grid" className="image img-style">
                    {" "}
                    <img
                      src="/images/location/location-1.jpg"
                      alt="image-location"
                    />{" "}
                  </Link>{" "}
                  <div className="content">
                    {" "}
                    <div className="inner-left">
                      {" "}
                      <span className="sub-title fw-6">321 Property</span>{" "}
                      <h6 className="title text-line-clamp-1 link">
                        Austin
                      </h6>{" "}
                    </div>{" "}
                    <Link
                      to="/topmap-grid"
                      className="box-icon line w-44 round"
                    >
                      <i className="icon icon-arrow-right2"></i>
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="sw-pagination sw-pagination-location text-center"></div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section">
        {" "}
        <div className="container">
          {" "}
          <div className="flat-img-with-text style-3 bg-primary-new">
            {" "}
            <div className="content-left img-animation wow">
              {" "}
              <img src="/images/banner/img-w-text6.jpg" alt="" />{" "}
            </div>{" "}
            <div className="content-right">
              {" "}
              <div className="box-title wow fadeInUp">
                {" "}
                <div className="text-subtitle text-primary">
                  Top Properties
                </div>{" "}
                <h3 className="title mt-4">Recommended For You</h3>{" "}
              </div>{" "}
              <div
                className="flat-property-box wow fadeInUp"
                data-wow-delay=".2s"
              >
                {" "}
                <div className="archive-top">
                  {" "}
                  <ul className="d-flex gap-6">
                    <li className="flag-tag primary">Featured</li>
                    <li className="flag-tag style-1">For Sale</li>
                  </ul>{" "}
                  <h4 className="title">
                    <Link to="/property-details-v1" className="link">
                      Rancho Vista Verde, Santa Barbara
                    </Link>
                  </h4>{" "}
                  <ul className="meta-list">
                    <li className="item">
                      {" "}
                      <i className="icon icon-bed"></i>{" "}
                      <span className="text-variant-1">Beds:</span>{" "}
                      <span className="fw-6">3</span>{" "}
                    </li>
                    <li className="item">
                      {" "}
                      <i className="icon icon-bath"></i>{" "}
                      <span className="text-variant-1">Baths:</span>{" "}
                      <span className="fw-6">2</span>{" "}
                    </li>
                    <li className="item">
                      {" "}
                      <i className="icon icon-sqft"></i>{" "}
                      <span className="text-variant-1">Sqft:</span>{" "}
                      <span className="fw-6">1150</span>{" "}
                    </li>
                  </ul>{" "}
                  <div className="meta-location d-flex gap-4 align-items-center mt-16">
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
                        d="M10 7C10 7.53043 9.78929 8.03914 9.41421 8.41421C9.03914 8.78929 8.53043 9 8 9C7.46957 9 6.96086 8.78929 6.58579 8.41421C6.21071 8.03914 6 7.53043 6 7C6 6.46957 6.21071 5.96086 6.58579 5.58579C6.96086 5.21071 7.46957 5 8 5C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7Z"
                        stroke="#A3ABB0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />{" "}
                      <path
                        d="M13 7C13 11.7613 8 14.5 8 14.5C8 14.5 3 11.7613 3 7C3 5.67392 3.52678 4.40215 4.46447 3.46447C5.40215 2.52678 6.67392 2 8 2C9.32608 2 10.5979 2.52678 11.5355 3.46447C12.4732 4.40215 13 5.67392 13 7Z"
                        stroke="#A3ABB0"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />{" "}
                    </svg>{" "}
                    <p className="text-variant-1">
                      145 Brooklyn Ave, Califonia, New York
                    </p>{" "}
                  </div>{" "}
                  <div className="box-avt">
                    {" "}
                    <div className="avatar avt-60">
                      {" "}
                      <img src="/images/avatar/avt-png2.png" alt="avt" />{" "}
                    </div>{" "}
                    <div className="content">
                      {" "}
                      <p className="caption-1 ">Agent</p>{" "}
                      <h6>Cameron Williamson</h6>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="archive-bottom">
                  {" "}
                  <div>
                    {" "}
                    <h4 className="d-inline-block">$250,00</h4>{" "}
                    <span className="body-2 text-variant-1">/month</span>{" "}
                  </div>{" "}
                  <div className="g-icon">
                    {" "}
                    <div className="item-icon">
                      {" "}
                      <span className="icon icon-heart"></span>{" "}
                    </div>{" "}
                    <div className="item-icon">
                      {" "}
                      <span className="icon icon-arrLeftRight"></span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section flat-testimonial pt-0">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title px-15">
            {" "}
            <div className="text-center wow fadeInUp">
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
            data-preview="3"
            data-tablet="2"
            data-mobile-sm="2"
            data-mobile="1"
            data-space="15"
            data-space-md="30"
            data-space-lg="30"
            data-centered="false"
            data-loop="false"
          >
            {" "}
            <div className="swiper-wrapper wow fadeInUp" data-wow-delay=".2s">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div className="box-tes-item style-2">
                  {" "}
                  <span className="icon icon-quote"></span>{" "}
                  <p className="note body-2">
                    {" "}
                    "My experience with property management services has
                    exceeded expectations. They efficiently manage properties
                    with a professional and attentive approach in every
                    situation. I feel reassured that any issue will be resolved
                    promptly and effectively."{" "}
                  </p>{" "}
                  <div className="box-avt d-flex align-items-center gap-12">
                    {" "}
                    <div className="avatar avt-60 round">
                      {" "}
                      <img
                        src="/images/avatar/avt-png1.png"
                        alt="avatar"
                      />{" "}
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
                <div className="box-tes-item style-2">
                  {" "}
                  <span className="icon icon-quote"></span>{" "}
                  <p className="note body-2">
                    {" "}
                    "My experience with property management services has
                    exceeded expectations. They efficiently manage properties
                    with a professional and attentive approach in every
                    situation. I feel reassured that any issue will be resolved
                    promptly and effectively."{" "}
                  </p>{" "}
                  <div className="box-avt d-flex align-items-center gap-12">
                    {" "}
                    <div className="avatar avt-60 round">
                      {" "}
                      <img
                        src="/images/avatar/avt-png2.png"
                        alt="avatar"
                      />{" "}
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
                <div className="box-tes-item style-2">
                  {" "}
                  <span className="icon icon-quote"></span>{" "}
                  <p className="note body-2">
                    {" "}
                    "My experience with property management services has
                    exceeded expectations. They efficiently manage properties
                    with a professional and attentive approach in every
                    situation. I feel reassured that any issue will be resolved
                    promptly and effectively."{" "}
                  </p>{" "}
                  <div className="box-avt d-flex align-items-center gap-12">
                    {" "}
                    <div className="avatar avt-60 round">
                      {" "}
                      <img
                        src="/images/avatar/avt-png4.png"
                        alt="avatar"
                      />{" "}
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
                <div className="box-tes-item style-2">
                  {" "}
                  <span className="icon icon-quote"></span>{" "}
                  <p className="note body-2">
                    {" "}
                    "My experience with property management services has
                    exceeded expectations. They efficiently manage properties
                    with a professional and attentive approach in every
                    situation. I feel reassured that any issue will be resolved
                    promptly and effectively."{" "}
                  </p>{" "}
                  <div className="box-avt d-flex align-items-center gap-12">
                    {" "}
                    <div className="avatar avt-60 round">
                      {" "}
                      <img
                        src="/images/avatar/avt-png6.png"
                        alt="avatar"
                      />{" "}
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
            </div>{" "}
            <div className="sw-pagination sw-pagination-testimonial text-center"></div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <PartnerSection />{" "}
      <section className="mx-5 bg-primary-new radius-30">
        {" "}
        <div className="flat-img-with-text">
          {" "}
          <div className="content-left img-animation wow">
            {" "}
            <img src="/images/banner/img-w-text5.jpg" alt="" />{" "}
          </div>{" "}
          <div className="content-right">
            {" "}
            <div className="box-title wow fadeInUp">
              {" "}
              <div className="text-subtitle text-primary">Our Benifit</div>{" "}
              <h3 className="title mt-4">Why Choose HomeLengo</h3>{" "}
              <p className="desc text-variant-1">
                Our seasoned team excels in real estate with years of successful
                market navigation, offering informed decisions and optimal
                results.
              </p>{" "}
            </div>{" "}
            <div className="flat-service wow fadeInUp" data-wow-delay=".2s">
              {" "}
              <a href="#" className="box-benefit hover-btn-view">
                {" "}
                <div className="icon-box">
                  {" "}
                  <span className="icon icon-proven"></span>{" "}
                </div>{" "}
                <div className="content">
                  {" "}
                  <h5 className="title">Proven Expertise</h5>{" "}
                  <p className="description">
                    Our seasoned team excels in real estate with years of
                    successful market navigation, offering informed decisions
                    and optimal results.
                  </p>{" "}
                </div>{" "}
              </a>{" "}
              <a href="#" className="box-benefit hover-btn-view">
                {" "}
                <div className="icon-box">
                  {" "}
                  <span className="icon icon-customize"></span>{" "}
                </div>{" "}
                <div className="content">
                  {" "}
                  <h5 className="title">Customized Solutions</h5>{" "}
                  <p className="description">
                    We pride ourselves on crafting personalized strategies to
                    match your unique goals, ensuring a seamless real estate
                    journey.
                  </p>{" "}
                </div>{" "}
              </a>{" "}
              <a href="#" className="box-benefit hover-btn-view">
                {" "}
                <div className="icon-box">
                  {" "}
                  <span className="icon icon-partnership"></span>{" "}
                </div>{" "}
                <div className="content">
                  {" "}
                  <h5 className="title">Transparent Partnerships</h5>{" "}
                  <p className="description">
                    Transparency is key in our client relationships. We
                    prioritize clear communication and ethical practices,
                    fostering trust and reliability throughout.
                  </p>{" "}
                </div>{" "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section flat-agents">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">Our Teams</div>{" "}
            <h3 className="title mt-4">Meet Our Agents</h3>{" "}
          </div>{" "}
          <div
            dir="ltr"
            className="swiper tf-sw-mobile-1"
            data-screen="575"
            data-preview="1"
            data-space="15"
          >
            {" "}
            <div className="tf-layout-mobile-sm xl-col-4 sm-col-2 swiper-wrapper">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="box-agent hover-img wow fadeInUp"
                  data-wow-delay=".2s"
                >
                  {" "}
                  <a href="#" className="box-img img-style">
                    {" "}
                    <img
                      src="/images/agents/agent-5.jpg"
                      alt="image-agent"
                    />{" "}
                    <ul className="agent-social">
                      <li>
                        <span className="icon icon-facebook"></span>
                      </li>
                      <li>
                        <span className="icon icon-x"></span>
                      </li>
                      <li>
                        <span className="icon icon-linkedin"></span>
                      </li>
                      <li>
                        <span className="icon icon-instargram"></span>
                      </li>
                    </ul>{" "}
                  </a>{" "}
                  <div className="content">
                    {" "}
                    <div className="info">
                      {" "}
                      <h5>
                        <a className="link" href="#">
                          Chris Patt
                        </a>
                      </h5>{" "}
                      <p className="text-variant-1">
                        Administrative Staff
                      </p>{" "}
                    </div>{" "}
                    <div className="box-icon">
                      {" "}
                      <span className="icon icon-phone"></span>{" "}
                      <span className="icon icon-mail"></span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="box-agent hover-img wow fadeInUp"
                  data-wow-delay=".3s"
                >
                  {" "}
                  <a href="#" className="box-img img-style">
                    {" "}
                    <img
                      src="/images/agents/agent-6.jpg"
                      alt="image-agent"
                    />{" "}
                    <ul className="agent-social">
                      <li>
                        <span className="icon icon-facebook"></span>
                      </li>
                      <li>
                        <span className="icon icon-x"></span>
                      </li>
                      <li>
                        <span className="icon icon-linkedin"></span>
                      </li>
                      <li>
                        <span className="icon icon-instargram"></span>
                      </li>
                    </ul>{" "}
                  </a>{" "}
                  <div className="content">
                    {" "}
                    <div className="info">
                      {" "}
                      <h5>
                        <a className="link" href="#">
                          Marvin McKinney
                        </a>
                      </h5>{" "}
                      <p className="text-variant-1">
                        Administrative Staff
                      </p>{" "}
                    </div>{" "}
                    <div className="box-icon">
                      {" "}
                      <span className="icon icon-phone"></span>{" "}
                      <span className="icon icon-mail"></span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="box-agent hover-img wow fadeInUp"
                  data-wow-delay=".4s"
                >
                  {" "}
                  <a href="#" className="box-img img-style">
                    {" "}
                    <img
                      src="/images/agents/agent-7.jpg"
                      alt="image-agent"
                    />{" "}
                    <ul className="agent-social">
                      <li>
                        <span className="icon icon-facebook"></span>
                      </li>
                      <li>
                        <span className="icon icon-x"></span>
                      </li>
                      <li>
                        <span className="icon icon-linkedin"></span>
                      </li>
                      <li>
                        <span className="icon icon-instargram"></span>
                      </li>
                    </ul>{" "}
                  </a>{" "}
                  <div className="content">
                    {" "}
                    <div className="info">
                      {" "}
                      <h5 className="link">
                        <a className="link" href="#">
                          Wade Warren
                        </a>
                      </h5>{" "}
                      <p className="text-variant-1">
                        Administrative Staff
                      </p>{" "}
                    </div>{" "}
                    <div className="box-icon">
                      {" "}
                      <span className="icon icon-phone"></span>{" "}
                      <span className="icon icon-mail"></span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="box-agent hover-img wow fadeInUp"
                  data-wow-delay=".5s"
                >
                  {" "}
                  <a href="#" className="box-img img-style">
                    {" "}
                    <img
                      src="/images/agents/agent-8.jpg"
                      alt="image-agent"
                    />{" "}
                    <ul className="agent-social">
                      <li>
                        <span className="icon icon-facebook"></span>
                      </li>
                      <li>
                        <span className="icon icon-x"></span>
                      </li>
                      <li>
                        <span className="icon icon-linkedin"></span>
                      </li>
                      <li>
                        <span className="icon icon-instargram"></span>
                      </li>
                    </ul>{" "}
                  </a>{" "}
                  <div className="content">
                    {" "}
                    <div className="info">
                      {" "}
                      <h5>
                        <a className="link" href="#">
                          Devon Lane
                        </a>
                      </h5>{" "}
                      <p className="text-variant-1">
                        Administrative Staff
                      </p>{" "}
                    </div>{" "}
                    <div className="box-icon">
                      {" "}
                      <span className="icon icon-phone"></span>{" "}
                      <span className="icon icon-mail"></span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="sw-pagination sw-pagination-mb-1 text-center d-sm-none d-block"></div>{" "}
          </div>{" "}
          <p className="text-center desc body-2 text-variant-3">
            Become an agent and get the commission you deserve.{" "}
            <Link to="/contact" className="text-primary">
              {" "}
              Contact us
            </Link>
          </p>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section pt-0">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">Latest New</div>{" "}
            <h3 className="title mt-4">The Most Recent Estate</h3>{" "}
          </div>{" "}
          <div
            className="tf-grid-layout xl-col-4 sm-col-2 wow fadeInUp"
            data-wow-delay=".2s"
          >
            {" "}
            <Link
              to="/blog-detail"
              className="flat-blog-item hover-img style-1"
            >
              {" "}
              <div className="img-style">
                {" "}
                <img src="/images/blog/blog-20.jpg" alt="img-blog" />{" "}
              </div>{" "}
              <span className="date-post">January 28, 2024</span>{" "}
              <div className="content-box">
                {" "}
                <h6 className="title">
                  Building gains into housing stocks...
                </h6>{" "}
                <div className="post-author">
                  {" "}
                  <span className="fw-6">Jerome Bell</span>{" "}
                  <span>Furniture</span>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              to="/blog-detail"
              className="flat-blog-item hover-img style-1"
            >
              {" "}
              <div className="img-style">
                {" "}
                <img src="/images/blog/blog-21.jpg" alt="img-blog" />{" "}
              </div>{" "}
              <span className="date-post">January 28, 2024</span>{" "}
              <div className="content-box">
                {" "}
                <h6 className="title">
                  92% of millennial home buyers say inflation...
                </h6>{" "}
                <div className="post-author">
                  {" "}
                  <span className="fw-6">Jerome Bell</span>{" "}
                  <span>Furniture</span>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              to="/blog-detail"
              className="flat-blog-item hover-img style-1"
            >
              {" "}
              <div className="img-style">
                {" "}
                <img src="/images/blog/blog-22.jpg" alt="img-blog" />{" "}
              </div>{" "}
              <span className="date-post">January 28, 2024</span>{" "}
              <div className="content-box">
                {" "}
                <h6 className="title">
                  Building gains into housing stocks and how...
                </h6>{" "}
                <div className="post-author">
                  {" "}
                  <span className="fw-6">Jerome Bell</span>{" "}
                  <span>Furniture</span>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              to="/blog-detail"
              className="flat-blog-item hover-img style-1"
            >
              {" "}
              <div className="img-style">
                {" "}
                <img src="/images/blog/blog-23.jpg" alt="img-blog" />{" "}
              </div>{" "}
              <span className="date-post">January 28, 2024</span>{" "}
              <div className="content-box">
                {" "}
                <h6 className="title">
                  We are hiring moderately, says Compass CEO...
                </h6>{" "}
                <div className="post-author">
                  {" "}
                  <span className="fw-6">Jerome Bell</span>{" "}
                  <span>Furniture</span>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section bg-primary-new">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">Latest New</div>{" "}
            <h3 className="title mt-4">From Our Blog</h3>{" "}
          </div>{" "}
          <div
            dir="ltr"
            className="swiper tf-sw-latest"
            data-preview="3"
            data-tablet="2"
            data-mobile-sm="2"
            data-mobile="1"
            data-space-lg="30"
            data-space-md="15"
            data-space="15"
          >
            {" "}
            <div className="swiper-wrapper wow fadeInUp" data-wow-delay=".2s">
              {" "}
              <div className="swiper-slide">
                {" "}
                <Link to="/blog-detail" className="flat-blog-item hover-img">
                  {" "}
                  <div className="img-style">
                    {" "}
                    <img src="/images/blog/blog-17.jpg" alt="img-blog" />{" "}
                    <span className="date-post">January 28, 2024</span>{" "}
                  </div>{" "}
                  <div className="content-box">
                    {" "}
                    <div className="post-author">
                      {" "}
                      <span className="fw-6">Jerome Bell</span>{" "}
                      <span>Furniture</span>{" "}
                    </div>{" "}
                    <h5 className="title link">
                      Building gains into housing stocks and how to trade the
                      sector
                    </h5>{" "}
                    <p className="description">
                      The average contract interest rate for 30-year fixed-rate
                      mortgages with conforming loan balances...
                    </p>{" "}
                  </div>{" "}
                </Link>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <Link to="/blog-detail" className="flat-blog-item hover-img">
                  {" "}
                  <div className="img-style">
                    {" "}
                    <img src="/images/blog/blog-18.jpg" alt="img-blog" />{" "}
                    <span className="date-post">January 28, 2024</span>{" "}
                  </div>{" "}
                  <div className="content-box">
                    {" "}
                    <div className="post-author">
                      {" "}
                      <span className="fw-6">Jerome Bell</span>{" "}
                      <span>Furniture</span>{" "}
                    </div>{" "}
                    <h5 className="title link">
                      Building gains into housing stocks and how to trade the
                      sector
                    </h5>{" "}
                    <p className="description">
                      The average contract interest rate for 30-year fixed-rate
                      mortgages with conforming loan balances...
                    </p>{" "}
                  </div>{" "}
                </Link>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <Link to="/blog-detail" className="flat-blog-item hover-img">
                  {" "}
                  <div className="img-style">
                    {" "}
                    <img src="/images/blog/blog-19.jpg" alt="img-blog" />{" "}
                    <span className="date-post">January 28, 2024</span>{" "}
                  </div>{" "}
                  <div className="content-box">
                    {" "}
                    <div className="post-author">
                      {" "}
                      <span className="fw-6">Jerome Bell</span>{" "}
                      <span>Furniture</span>{" "}
                    </div>{" "}
                    <h5 className="title link">
                      Building gains into housing stocks and how to trade the
                      sector
                    </h5>{" "}
                    <p className="description">
                      The average contract interest rate for 30-year fixed-rate
                      mortgages with conforming loan balances...
                    </p>{" "}
                  </div>{" "}
                </Link>{" "}
              </div>{" "}
            </div>{" "}
            <div className="sw-pagination sw-pagination-latest text-center"></div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </>
  );
}
