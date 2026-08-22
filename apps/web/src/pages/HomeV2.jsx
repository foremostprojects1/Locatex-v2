import AnimatedHeadline from "../components/common/AnimatedHeadline";
import { Link } from "react-router-dom";
import PropertyCard from "../components/common/PropertyCard";
import { PROPERTIES } from "../data/properties";
import NiceSelect from "../components/common/NiceSelect";
import RangeSliderWidget from "../components/common/RangeSliderWidget";
import PartnerSection from "../components/sections/PartnerSection";

export default function HomeV2() {
  return (
    <>
      {" "}
      <section className="flat-slider home-2 bg-primary-new">
        {" "}
        <div className="container relative">
          {" "}
          <div className="row">
            {" "}
            <div className="col-xl-10">
              {" "}
              <div className="slider-content">
                {" "}
                <div className="heading">
                  {" "}
                  <h1 className="fw-8 title animationtext clip">
                    Find A Home That <br />{" "}
                    <AnimatedHeadline
                      type="clip"
                      words={["Fits Perfectly", "Fits Dream Home"]}
                    />{" "}
                  </h1>{" "}
                  <p
                    className="subtitle body-2 wow fadeInUp"
                    data-wow-delay=".2s"
                  >
                    We are a real estate agency that will help you find the best{" "}
                    <br /> residence you dream of.
                  </p>{" "}
                </div>{" "}
                <div className="flat-tab flat-tab-form">
                  {" "}
                  <ul className="nav-tab-form style-2" role="tablist">
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
                          <div className="wd-find-select style-2">
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
                <div className="wrap-search-link">
                  {" "}
                  <p className="body-2">What are you looking for:</p>{" "}
                  <div className="categories-list">
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
          </div>{" "}
        </div>{" "}
        <div className="img-banner-left">
          {" "}
          <img src="/images/slider/graplic-slider-2.png" alt="img" />{" "}
        </div>{" "}
        <div className="img-banner-right">
          {" "}
          <div dir="ltr" className="swiper slider-sw-home2">
            {" "}
            <div className="swiper-wrapper">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div className="slider-home2 img-animation wow">
                  {" "}
                  <img src="/images/slider/slider-2.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="slider-home2">
                  {" "}
                  <img src="/images/slider/slider-2-1.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div className="slider-home2">
                  {" "}
                  <img src="/images/slider/slider-2-3.jpg" alt="images" />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section flat-categories">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title style-1 wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">Property Type</div>{" "}
            <h3 className="title mt-4">Try Searching For</h3>{" "}
          </div>{" "}
          <div className="wrap-categories-sw wow fadeInUp" data-wow-delay=".2s">
            {" "}
            <div
              dir="ltr"
              className="swiper tf-sw-categories sw-over"
              data-preview="6"
              data-tablet="4"
              data-mobile-sm="3"
              data-mobile="2"
              data-space="15"
              data-space-md="30"
              data-space-lg="30"
            >
              {" "}
              <div className="swiper-wrapper">
                {" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <span className="icon icon-apartment1"></span>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Apartment</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <span className="icon icon-villa-line"></span>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Villa</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <span className="icon icon-studio"></span>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Studio</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <p className="icon icon-office1"></p>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Office</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <p className="icon icon-townhouse"></p>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Townhouse</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
                <div className="swiper-slide">
                  {" "}
                  <a href="#" className="homelengo-categories">
                    {" "}
                    <div className="icon-box">
                      {" "}
                      <span className="icon icon-commercial"></span>{" "}
                    </div>{" "}
                    <div className="content text-center">
                      {" "}
                      <h6>Commercial</h6>{" "}
                      <p className="mt-4 text-variant-1">234 Property</p>{" "}
                    </div>{" "}
                  </a>{" "}
                </div>{" "}
              </div>{" "}
              <div className="sw-pagination sw-pagination-category text-center"></div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section flat-recommended pt-0">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">
              Featured Properties
            </div>{" "}
            <h3 className="title mt-4">
              Discover LocateX's Finest Properties for Your Dream Home
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
              <div className="tab-pane" id="villa" role="tabpanel">
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
      <section className="flat-section bg-primary-new">
        {" "}
        <div className="container3">
          {" "}
          <div className="flat-img-with-text-v2">
            {" "}
            <div className="content-left tf-image-box">
              {" "}
              <div className="grid-img-group">
                {" "}
                <div className="tf-image-wrap item-1">
                  {" "}
                  <div className="img-style hover-img-wrap">
                    {" "}
                    <img src="/images/banner/img-w-text-sm1.jpg" alt="" />{" "}
                  </div>{" "}
                  <div className="tag-item ani5">
                    {" "}
                    <i className="icon icon-check-circle"></i>{" "}
                    <span>Proven Expertise</span>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="tf-image-wrap item-2">
                  {" "}
                  <div className="img-style hover-img-wrap">
                    {" "}
                    <img src="/images/banner/img-w-text2.jpg" alt="" />{" "}
                  </div>{" "}
                  <div className="tag-item tag-item-1 ani4">
                    {" "}
                    <i className="icon icon-check-circle"></i>{" "}
                    <span>Customized Solutions</span>{" "}
                  </div>{" "}
                  <div className="tag-item tag-item-2 ani5">
                    {" "}
                    <i className="icon icon-check-circle"></i>{" "}
                    <span>Transparent Partnerships</span>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="tf-image-wrap item-3">
                  {" "}
                  <div className="img-style hover-img-wrap">
                    {" "}
                    <img src="/images/banner/img-w-text-sm2.jpg" alt="" />{" "}
                  </div>{" "}
                  <div className="tag-item ani4">
                    {" "}
                    <i className="icon icon-check-circle"></i>{" "}
                    <span>Local Area Knowledge</span>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="content-right">
              {" "}
              <div className="box-title wow fadeInUp">
                {" "}
                <div className="text-subtitle text-primary">
                  Our Benifit
                </div>{" "}
                <h3 className="title mt-4">
                  Discover what sets our Real Estate expertise apart
                </h3>{" "}
                <p className="desc text-variant-1">
                  Our seasoned professionals, armed with extensive market
                  knowledge, walk alongside you through every phase of your
                  property endeavor.
                </p>{" "}
              </div>{" "}
              <div className="flat-service wow fadeInUp" data-wow-delay=".2s">
                {" "}
                <a href="#" className="box-benefit hover-btn-view">
                  {" "}
                  <div className="icon-box">
                    {" "}
                    <span className="icon">
                      {" "}
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <g clipPath="url(#clip0_13434_4230)">
                          {" "}
                          <path
                            d="M49.1313 20.4375V20.3961L49.102 20.3668L34.477 5.74179L34.406 5.67085L34.3353 5.74202L19.8041 20.367L19.775 20.3963V20.4375V26.7188C19.775 27.1389 19.4384 27.5562 18.9375 27.5562C18.679 27.5562 18.4713 27.4705 18.3285 27.3277C18.1857 27.1849 18.1 26.9773 18.1 26.7188V20.0625C18.1 19.9335 18.1214 19.8306 18.1617 19.7398C18.2022 19.6487 18.2641 19.5648 18.352 19.477L18.3522 19.4767L33.352 4.38321C33.9692 3.76601 34.8433 3.76601 35.4605 4.38321L50.5543 19.477C50.6421 19.5648 50.704 19.6487 50.7446 19.7398C50.7849 19.8306 50.8063 19.9335 50.8063 20.0625V32.0625C50.8063 32.2644 50.7043 32.4746 50.5426 32.6363C50.3808 32.7981 50.1706 32.9 49.9688 32.9C49.5486 32.9 49.1313 32.5634 49.1313 32.0625V20.4375ZM49.0312 10.6812C48.6111 10.6812 48.1938 10.3446 48.1938 9.84375V4.3125C48.1938 3.68839 47.6736 3.275 47.1562 3.275H45.8438C45.2196 3.275 44.8063 3.79513 44.8063 4.3125V4.6875C44.8063 5.10763 44.4696 5.525 43.9688 5.525C43.7102 5.525 43.5026 5.43926 43.3598 5.29648C43.217 5.15369 43.1313 4.94603 43.1313 4.6875V4.3125C43.1313 2.86555 44.3074 1.6 45.8438 1.6H47.1562C48.6032 1.6 49.8687 2.77613 49.8687 4.3125V9.84375C49.8687 10.0456 49.7668 10.2558 49.6051 10.4176C49.4433 10.5793 49.2331 10.6812 49.0312 10.6812Z"
                            fill="#1563DF"
                            stroke="white"
                            strokeWidth="0.2"
                          />{" "}
                          <path
                            d="M49.6705 20.8422L49.6709 20.8419L49.6642 20.8353L34.4767 5.74157L34.406 5.6713L34.3355 5.74179L19.2417 20.8355C18.2516 21.8256 16.4391 21.8303 15.3504 20.834C14.266 19.748 14.2665 18.0311 15.3519 16.9457L30.7267 1.66468L30.7269 1.66446C31.7391 0.652268 33.1198 0.1 34.5 0.1C35.8811 0.1 37.2594 0.652766 38.176 1.66102L38.1759 1.66109L38.1792 1.66446L53.4605 16.9457C54.5464 18.0317 54.5464 19.7496 53.4605 20.8355C52.9155 21.3805 52.2842 21.65 51.5625 21.65C50.8351 21.65 50.1162 21.377 49.6705 20.8422ZM16.5232 18.1166L16.523 18.1168C16.1089 18.5308 16.1089 19.2504 16.523 19.6645C16.937 20.0785 17.6566 20.0785 18.0707 19.6645L33.3519 4.38321C33.6142 4.12093 34.0574 3.94375 34.4062 3.94375C34.755 3.94375 35.1982 4.12093 35.4605 4.38321L50.7417 19.6645C51.1558 20.0785 51.8754 20.0785 52.2894 19.6645C52.7035 19.2504 52.7035 18.5308 52.2894 18.1168L37.0094 2.83673C35.6575 1.38987 33.2488 1.38984 31.8969 2.83663L16.5232 18.1166ZM13.233 36.2205L13.2325 36.2212C13.1113 36.3827 12.9037 36.4897 12.6772 36.5221C12.4508 36.5544 12.2214 36.5099 12.06 36.3887C11.8985 36.2676 11.7915 36.06 11.7591 35.8335C11.7268 35.6074 11.7712 35.3783 11.892 35.2169C13.1952 33.5416 15.0597 31.9558 17.3952 30.5545L17.3952 30.5546L17.3982 30.5526C21.1084 28.141 25.9333 28.6032 29.2761 31.6675L29.2768 31.6681C30.2316 32.5274 31.2863 32.9125 32.3437 32.9125H37.7812C40.0697 32.9125 41.9937 34.8365 41.9937 37.125V37.2188C41.9937 38.2253 41.6277 39.1421 41.0762 39.8775L41.0761 39.8774L41.073 39.882C40.9091 40.1278 40.6644 40.2125 40.4062 40.2125C40.2492 40.2125 40.0865 40.1345 39.8968 40.0397C39.7392 39.918 39.636 39.714 39.6151 39.4944C39.594 39.2728 39.6577 39.0461 39.8207 38.8832C40.2199 38.484 40.4125 37.8926 40.4125 37.2188V37.125C40.4125 35.661 39.2402 34.5875 37.875 34.5875H32.4375C30.871 34.5875 29.4886 34.036 28.193 32.833C25.4423 30.272 21.3613 29.8903 18.3215 31.8842C16.159 33.2007 14.4613 34.6143 13.233 36.2205ZM40.2187 31.4C39.7986 31.4 39.3812 31.0634 39.3812 30.5625V25.6875C39.3812 24.7846 38.5824 24.0875 37.7812 24.0875H30.9375C30.0345 24.0875 29.3375 24.8863 29.3375 25.6875V27.75C29.3375 28.1701 29.0008 28.5875 28.5 28.5875C28.2414 28.5875 28.0338 28.5018 27.891 28.359C27.7482 28.2162 27.6625 28.0085 27.6625 27.75V25.6875C27.6625 23.9597 29.1195 22.4125 30.9375 22.4125H37.7812C39.509 22.4125 41.0562 23.8695 41.0562 25.6875V30.5625C41.0562 30.7644 40.9543 30.9746 40.7925 31.1363C40.6308 31.2981 40.4206 31.4 40.2187 31.4Z"
                            fill="#1563DF"
                            stroke="white"
                            strokeWidth="0.2"
                          />{" "}
                          <path
                            d="M22.0345 49.4757L22.0354 49.4755L22.0303 49.4629C21.8635 49.0457 22.1188 48.5532 22.5196 48.4731C22.9777 48.3814 23.3439 48.3813 23.7188 48.3813L23.7216 48.3812L36.8466 48.0062L36.8469 48.0062C39.8622 47.912 42.6884 47.158 45.4185 45.8401L45.4197 45.8394C49.9243 43.5871 53.9608 40.9591 57.4351 38.0488C57.7482 37.8377 57.85 37.5216 57.85 37.2188C57.85 37.0665 57.8245 36.9351 57.7711 36.8149C57.7178 36.6951 57.6391 36.5914 57.5395 36.4918L57.5396 36.4916L57.5342 36.4869C56.095 35.2396 54.0804 35.0493 52.3577 36.0063L52.3576 36.0062L52.3527 36.0093C49.553 37.7824 45.9085 39.1853 41.04 40.3088L41.0093 40.3159L40.9882 40.3394C40.1642 41.2548 39.0667 41.7125 37.875 41.7125H31.3125C30.8924 41.7125 30.475 41.3759 30.475 40.875C30.475 40.6165 30.5607 40.4088 30.7035 40.266C30.8463 40.1232 31.054 40.0375 31.3125 40.0375H37.875C38.7447 40.0375 39.4342 39.7454 39.9251 39.0581L39.9297 39.0517L39.9332 39.0447C40.0081 38.8949 40.1577 38.8144 40.3466 38.7198C45.2215 37.5939 48.7912 36.1855 51.5196 34.4924C53.8274 33.2011 56.6869 33.4794 58.6224 35.1384L58.6222 35.1387L58.6294 35.1439C59.2518 35.5884 59.525 36.303 59.525 37.125C59.525 37.9391 59.1634 38.7525 58.44 39.295L58.4399 39.2949L58.4368 39.2975C54.8804 42.1988 50.6677 44.9138 46.0796 47.2547L46.0791 47.2549C43.1873 48.7474 40.0147 49.4942 36.8408 49.5875L23.7188 49.9625H23.7174H23.0625H23.0211L22.9918 49.9918C22.9291 50.0545 22.8735 50.0563 22.7812 50.0563C22.4509 50.0563 22.1168 49.8051 22.0345 49.4757ZM13.7707 59.5695L13.7708 59.5694L13.7674 59.5649L0.736198 42.2212L0.737 42.2206L0.726961 42.2105C0.573335 42.0569 0.56875 41.8206 0.56875 41.625C0.56875 41.3947 0.721343 41.2355 0.888471 41.1519L0.896383 41.148L0.903477 41.1427L5.30973 37.8615L5.31 37.8613C6.04095 37.313 6.95685 37.0375 7.875 37.0375C9.24745 37.0375 10.4383 37.6771 11.265 38.6867L20.1699 50.5912L20.1699 50.5912L20.1711 50.5926C20.8132 51.4183 21.1773 52.5157 20.9951 53.6086C20.811 54.7131 20.2595 55.8135 19.3457 56.5454L14.948 59.7267C14.7578 59.8217 14.5948 59.9 14.4375 59.9C14.1793 59.9 13.9346 59.8153 13.7707 59.5695ZM2.66005 41.8253L2.57769 41.885L2.63881 41.9663L14.5451 57.8101L14.6048 57.8896L14.6847 57.8302L18.3389 55.113C18.9264 54.7203 19.3143 54.0382 19.4115 53.3579C19.5097 52.6707 19.3114 52.0837 18.927 51.507L18.9271 51.507L18.9238 51.5026L10.0184 39.5974C10.0182 39.5973 10.0181 39.5971 10.018 39.5969C9.62477 39.0566 8.98973 38.7168 8.32299 38.6198C7.6566 38.5229 6.9484 38.6671 6.40771 39.1082L2.66005 41.8253Z"
                            fill="#1563DF"
                            stroke="white"
                            strokeWidth="0.2"
                          />{" "}
                        </g>{" "}
                        <defs>
                          {" "}
                          <clipPath id="clip0_13434_4230">
                            {" "}
                            <rect width="60" height="60" fill="white" />{" "}
                          </clipPath>{" "}
                        </defs>{" "}
                      </svg>{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="content">
                    {" "}
                    <h5 className="title">Buy A New Home</h5>{" "}
                    <p className="description">
                      Explore diverse properties and expert guidance for a
                      seamless buying experience.
                    </p>{" "}
                    <span className="btn-view style-1">
                      <span className="text">Explore Now</span>{" "}
                      <span className="icon icon-arrow-right2"></span>{" "}
                    </span>{" "}
                  </div>{" "}
                </a>{" "}
                <a href="#" className="box-benefit hover-btn-view">
                  {" "}
                  <div className="icon-box">
                    {" "}
                    <span className="icon">
                      {" "}
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <g clipPath="url(#clip0_13434_4244)">
                          {" "}
                          <path
                            d="M36.5625 5.53125C34.0312 5.25 31.4062 5.71875 28.9687 7.03125C24.375 9.65625 22.125 14.7187 22.875 19.5937L3.09374 30.8437C2.90624 30.9375 2.71874 31.2187 2.62499 31.4062C2.15624 33.1875 1.78124 34.4062 1.31249 36.0937C1.12499 36.5625 1.49999 37.125 1.96874 37.2187C3.65624 37.6875 4.87499 38.0625 6.65624 38.5312C6.93749 38.625 7.21874 38.5312 7.40624 38.4375L8.62499 37.6875C8.90624 37.5937 8.99999 37.3125 9.09374 37.0312L9.56249 34.2187C9.65624 33.6562 10.3125 33.2812 10.7812 33.4687L12.8437 34.2187C13.4062 34.4062 13.9687 34.125 14.0625 33.4687L14.4375 31.3125C14.5312 30.75 15.1875 30.375 15.6562 30.5625L17.7187 31.3125C18.2812 31.5 18.8437 31.2187 18.9375 30.5625L19.3125 28.4062C19.4062 27.8437 20.0625 27.4687 20.5312 27.6562L23.25 28.6875C23.5312 28.7812 23.8125 28.7812 24 28.5937L26.25 27.375"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M53.1563 23.4375C52.125 28.5937 48 32.3438 43.125 33.1875L42.4688 36.6562C42.375 36.9375 42.2813 37.125 42 37.3125L39.375 38.7187C38.9063 39 38.7188 39.6562 39.0938 40.125L40.5 41.8125C40.875 42.2812 40.6875 42.9375 40.2188 43.2187L38.3438 44.25C37.7813 44.5312 37.6875 45.1875 38.0625 45.6562L39.4688 47.3437C39.8438 47.8125 39.75 48.4687 39.1875 48.75L37.3125 49.7812C36.8438 50.0625 36.6563 50.7187 37.0313 51.1875L38.9063 53.4375C39.0938 53.625 39.1875 53.9062 39.0938 54.1875L38.8125 55.5937C38.7188 55.875 38.625 56.0625 38.4375 56.25C36.8438 57.2812 35.8125 58.0313 34.4063 58.9688C33.9375 59.25 33.375 59.1562 33.0938 58.6875C32.0625 57.1875 31.4063 56.1562 30.375 54.6562C30 54.375 30 54.0938 30 53.8125L34.4063 31.5C30.1875 28.875 27.8438 23.8125 28.875 18.6562C30.1875 12 36.6563 7.59375 43.4063 8.90625C50.1563 10.2187 54.4688 16.7812 53.1563 23.4375Z"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M41.8125 20.4375C43.8318 20.4375 45.4687 18.8005 45.4687 16.7812C45.4687 14.762 43.8318 13.125 41.8125 13.125C39.7932 13.125 38.1562 14.762 38.1562 16.7812C38.1562 18.8005 39.7932 20.4375 41.8125 20.4375Z"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M53.25 19.3125C55.875 18 57.9375 15.5625 58.5 12.4687C59.5312 7.21875 56.1562 2.15625 50.9062 1.125C45.6562 0.0937479 40.5937 3.46875 39.5625 8.71875V8.8125C39 11.7187 39.8437 14.625 41.5312 16.7812"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </g>{" "}
                        <defs>
                          {" "}
                          <clipPath id="clip0_13434_4244">
                            {" "}
                            <rect width="60" height="60" fill="white" />{" "}
                          </clipPath>{" "}
                        </defs>{" "}
                      </svg>{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="content">
                    {" "}
                    <h5 className="title">Rent a home</h5>{" "}
                    <p className="description">
                      Explore a diverse variety of listings tailored precisely
                      to suit your unique lifestyle needs.
                    </p>{" "}
                    <span className="btn-view style-1">
                      <span className="text">Explore Now</span>{" "}
                      <span className="icon icon-arrow-right2"></span>{" "}
                    </span>{" "}
                  </div>{" "}
                </a>{" "}
                <a href="#" className="box-benefit hover-btn-view">
                  {" "}
                  <div className="icon-box">
                    {" "}
                    <span className="icon">
                      {" "}
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <g clipPath="url(#clip0_13434_4259)">
                          {" "}
                          <path
                            d="M47.3438 45.375V59.0625H5.625V39.1875M26.625 14.3438C26.3437 14.25 26.0625 14.3437 25.7812 14.5312L5.34375 35.0625C4.3125 36.0938 2.71875 36.0938 1.6875 35.0625C1.21875 34.5938 0.9375 33.9375 0.9375 33.2813C0.9375 32.625 1.21875 31.9687 1.6875 31.5L22.2188 10.9687C23.7188 9.46875 25.7812 8.90625 27.6562 9.375M0.9375 59.0625H52.0312"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M33.6563 51.75V44.0625C33.6563 42.0938 32.8125 40.3125 31.5 39C30.1875 37.6875 28.4062 36.8437 26.4375 36.8437C22.5 36.8437 19.2187 40.0312 19.2187 44.0625V51.75M36.8437 58.0313V59.0625H16.125V58.0313C16.125 56.625 17.25 55.5 18.6562 55.5H34.3125C35.7187 55.5 36.8437 56.625 36.8437 58.0313ZM59.0625 15.2812C59.0625 20.8125 51.9375 33.375 47.8125 40.4062C46.4062 42.6562 43.125 42.6562 41.7187 40.4062C37.5 33.4687 30.4687 20.9062 30.4687 15.2812C30.375 7.3125 36.8438 0.9375 44.7188 0.9375C52.5937 0.9375 59.0625 7.3125 59.0625 15.2812Z"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M44.7187 24.4688C49.7929 24.4688 53.9062 20.3554 53.9062 15.2812C53.9062 10.2071 49.7929 6.09375 44.7187 6.09375C39.6446 6.09375 35.5312 10.2071 35.5312 15.2812C35.5312 20.3554 39.6446 24.4688 44.7187 24.4688Z"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                          <path
                            d="M22.6875 46.2188V48.0938V46.2188Z"
                            fill="black"
                          />{" "}
                          <path
                            d="M22.6875 46.2188V48.0938"
                            stroke="#1563DF"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />{" "}
                        </g>{" "}
                        <defs>
                          {" "}
                          <clipPath id="clip0_13434_4259">
                            {" "}
                            <rect width="60" height="60" fill="white" />{" "}
                          </clipPath>{" "}
                        </defs>{" "}
                      </svg>{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="content">
                    {" "}
                    <h5 className="title">Sell a home</h5>{" "}
                    <p className="description">
                      Showcasing your property's best features for a successful
                      sale.
                    </p>{" "}
                    <span className="btn-view style-1">
                      <span className="text">Explore Now</span>{" "}
                      <span className="icon icon-arrow-right2"></span>{" "}
                    </span>{" "}
                  </div>{" "}
                </a>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="flat-section flat-location-v2">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title text-center wow fadeInUp">
            {" "}
            <div className="text-subtitle text-primary">
              Explore Cities
            </div>{" "}
            <h3 className="title mt-4">Our Location For You</h3>{" "}
          </div>{" "}
          <div className="grid-location wow fadeInUp" data-wow-delay=".2s">
            {" "}
            <Link
              to="/topmap-grid"
              className="item-1 box-location-v2 hover-img"
            >
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-7.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">Cape Town, South Africa</h6>{" "}
                <p className="mt-4 text-variant-1">221 Property</p>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              to="/topmap-grid"
              className="item-2 box-location-v2 hover-img"
            >
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-8.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">Seoul, South Korea</h6>{" "}
                <p className="mt-4 text-variant-1">128 Property</p>{" "}
              </div>{" "}
            </Link>{" "}
            <a href="#" className="item-3 box-location-v2 hover-img">
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-9.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">London, United Kingdom</h6>{" "}
                <p className="mt-4 text-variant-1">321 Property</p>{" "}
              </div>{" "}
            </a>{" "}
            <a href="#" className="item-4 box-location-v2 hover-img">
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-10.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">Connecticut, New England</h6>{" "}
                <p className="mt-4 text-variant-1">220 Property</p>{" "}
              </div>{" "}
            </a>{" "}
            <Link
              to="/topmap-grid"
              className="item-5 box-location-v2 hover-img"
            >
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-11.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">Sydney, Australia</h6>{" "}
                <p className="mt-4 text-variant-1">231 Property</p>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              to="/topmap-grid"
              className="item-6 box-location-v2 hover-img"
            >
              {" "}
              <div className="box-img img-style">
                {" "}
                <img
                  src="/images/location/location-12.jpg"
                  alt="image-location"
                />{" "}
              </div>{" "}
              <div className="content">
                {" "}
                <h6 className="link">New Jersey, New York</h6>{" "}
                <p className="mt-4 text-variant-1">234 Property</p>{" "}
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
            <div className="text-subtitle text-primary">
              Top Properties
            </div>{" "}
            <h3 className="title mt-4">Best Property Value</h3>{" "}
          </div>{" "}
          <div
            dir="ltr"
            className="swiper tf-sw-mobile"
            data-screen="991"
            data-preview="1"
            data-space="15"
          >
            {" "}
            <div className="tf-layout-mobile-lg lg-col-2 swiper-wrapper">
              {" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="homelengo-box list-style-1 wow fadeInUp"
                  data-wow-delay=".1s"
                >
                  {" "}
                  <div className="archive-top">
                    {" "}
                    <Link to="/property-details-v1" className="images-group">
                      {" "}
                      <div className="images-style">
                        {" "}
                        <img
                          src="/images/home/house-sm-1.jpg"
                          alt="img-property"
                        />{" "}
                      </div>{" "}
                      <div className="top">
                        {" "}
                        <ul className="d-flex gap-6 flex-wrap">
                          <li className="flag-tag primary">Featured</li>
                          <li className="flag-tag style-1">For Sale</li>
                        </ul>{" "}
                      </div>{" "}
                    </Link>{" "}
                  </div>{" "}
                  <div className="archive-bottom">
                    {" "}
                    <div className="content-top">
                      {" "}
                      <h6 className="text-capitalize">
                        <Link
                          to="/property-details-v1"
                          className="link text-line-clamp-1"
                        >
                          {" "}
                          Casa Lomas de Machalí Machas
                        </Link>
                      </h6>{" "}
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
                      <div className="location">
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
                        <span className="text-line-clamp-1">
                          {" "}
                          145 Brooklyn Ave, Califonia, New York{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="content-bottom">
                      {" "}
                      <div className="d-flex gap-8 align-items-center">
                        {" "}
                        <div className="avatar avt-40 round">
                          {" "}
                          <img
                            src="/images/avatar/avt-png3.png"
                            alt="avt"
                          />{" "}
                        </div>{" "}
                        <span>Arlene McCoy</span>{" "}
                      </div>{" "}
                      <h6 className="price">$7250,00</h6>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="homelengo-box list-style-1 wow fadeInUp"
                  data-wow-delay=".2s"
                >
                  {" "}
                  <div className="archive-top">
                    {" "}
                    <Link to="/property-details-v1" className="images-group">
                      {" "}
                      <div className="images-style">
                        {" "}
                        <img
                          src="/images/home/house-sm-2.jpg"
                          alt="img-property"
                        />{" "}
                      </div>{" "}
                      <div className="top">
                        {" "}
                        <ul className="d-flex gap-6 flex-wrap">
                          <li className="flag-tag primary">Featured</li>
                          <li className="flag-tag style-1">For Sale</li>
                        </ul>{" "}
                      </div>{" "}
                    </Link>{" "}
                  </div>{" "}
                  <div className="archive-bottom">
                    {" "}
                    <div className="content-top">
                      {" "}
                      <h6 className="text-capitalize">
                        <Link
                          to="/property-details-v1"
                          className="link text-line-clamp-1"
                        >
                          {" "}
                          Casa Lomas de Machalí Machas
                        </Link>
                      </h6>{" "}
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
                      <div className="location">
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
                        <span className="text-line-clamp-1">
                          {" "}
                          145 Brooklyn Ave, Califonia, New York{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="content-bottom">
                      {" "}
                      <div className="d-flex gap-8 align-items-center">
                        {" "}
                        <div className="avatar avt-40 round">
                          {" "}
                          <img
                            src="/images/avatar/avt-png4.png"
                            alt="avt"
                          />{" "}
                        </div>{" "}
                        <span>Arlene McCoy</span>{" "}
                      </div>{" "}
                      <h6 className="price">$7250,00</h6>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="homelengo-box list-style-1 wow fadeInUp"
                  data-wow-delay=".3s"
                >
                  {" "}
                  <div className="archive-top">
                    {" "}
                    <Link to="/property-details-v1" className="images-group">
                      {" "}
                      <div className="images-style">
                        {" "}
                        <img
                          src="/images/home/house-sm-3.jpg"
                          alt="img-property"
                        />{" "}
                      </div>{" "}
                      <div className="top">
                        {" "}
                        <ul className="d-flex gap-6 flex-wrap">
                          <li className="flag-tag primary">Featured</li>
                          <li className="flag-tag style-1">For Sale</li>
                        </ul>{" "}
                      </div>{" "}
                    </Link>{" "}
                  </div>{" "}
                  <div className="archive-bottom">
                    {" "}
                    <div className="content-top">
                      {" "}
                      <h6 className="text-capitalize">
                        <Link
                          to="/property-details-v1"
                          className="link text-line-clamp-1"
                        >
                          {" "}
                          Casa Lomas de Machalí Machas
                        </Link>
                      </h6>{" "}
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
                      <div className="location">
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
                        <span className="text-line-clamp-1">
                          {" "}
                          145 Brooklyn Ave, Califonia, New York{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="content-bottom">
                      {" "}
                      <div className="d-flex gap-8 align-items-center">
                        {" "}
                        <div className="avatar avt-40 round">
                          {" "}
                          <img
                            src="/images/avatar/avt-png5.png"
                            alt="avt"
                          />{" "}
                        </div>{" "}
                        <span>Arlene McCoy</span>{" "}
                      </div>{" "}
                      <h6 className="price">$7250,00</h6>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="swiper-slide">
                {" "}
                <div
                  className="homelengo-box list-style-1 wow fadeInUp"
                  data-wow-delay=".4s"
                >
                  {" "}
                  <div className="archive-top">
                    {" "}
                    <Link to="/property-details-v1" className="images-group">
                      {" "}
                      <div className="images-style">
                        {" "}
                        <img
                          src="/images/home/house-sm-4.jpg"
                          alt="img-property"
                        />{" "}
                      </div>{" "}
                      <div className="top">
                        {" "}
                        <ul className="d-flex gap-6 flex-wrap">
                          <li className="flag-tag primary">Featured</li>
                          <li className="flag-tag style-1">For Sale</li>
                        </ul>{" "}
                      </div>{" "}
                    </Link>{" "}
                  </div>{" "}
                  <div className="archive-bottom">
                    {" "}
                    <div className="content-top">
                      {" "}
                      <h6 className="text-capitalize">
                        <Link
                          to="/property-details-v1"
                          className="link text-line-clamp-1"
                        >
                          {" "}
                          Casa Lomas de Machalí Machas
                        </Link>
                      </h6>{" "}
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
                      <div className="location">
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
                        <span className="text-line-clamp-1">
                          {" "}
                          145 Brooklyn Ave, Califonia, New York{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="content-bottom">
                      {" "}
                      <div className="d-flex gap-8 align-items-center">
                        {" "}
                        <div className="avatar avt-40 round">
                          {" "}
                          <img
                            src="/images/avatar/avt-png6.png"
                            alt="avt"
                          />{" "}
                        </div>{" "}
                        <span>Arlene McCoy</span>{" "}
                      </div>{" "}
                      <h6 className="price">$7250,00</h6>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="sw-pagination sw-pagination-mb text-center d-lg-none d-block"></div>{" "}
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
      <section className="flat-section bg-primary-new flat-testimonial">
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
          <div className="swiper-wrapper wow fadeInUp" data-wow-delay=".2s">
            {" "}
            <div className="swiper-slide">
              {" "}
              <div className="box-tes-item">
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
              <div className="box-tes-item">
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
              <div className="box-tes-item">
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
              <div className="box-tes-item">
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
              <div className="box-tes-item">
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
              <div className="box-tes-item">
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
                    <img src="/images/blog/blog-5.jpg" alt="img-blog" />{" "}
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
                    <img src="/images/blog/blog-7.jpg" alt="img-blog" />{" "}
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
                    <img src="/images/blog/blog-9.jpg" alt="img-blog" />{" "}
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
      <PartnerSection />{" "}
    </>
  );
}
