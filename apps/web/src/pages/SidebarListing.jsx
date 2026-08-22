import { Link } from "react-router-dom";
import PropertyCard from "../components/common/PropertyCard";
import { PROPERTIES } from "../data/properties";
import NiceSelect from "../components/common/NiceSelect";
import RangeSliderWidget from "../components/common/RangeSliderWidget";

export default function SidebarListing({ defaultLayout = "grid" }) {
  const isGrid = defaultLayout === "grid";
  return (
    <>
      {" "}
      <section className="flat-section flat-recommended flat-sidebar">
        {" "}
        <div className="container">
          {" "}
          <div className="box-title-listing">
            {" "}
            <div className="box-left">
              {" "}
              <h3 className="fw-8">Property Listing</h3>{" "}
              <p className="text">
                There are currently 164,814 properties.
              </p>{" "}
            </div>{" "}
            <div className="box-filter-tab">
              {" "}
              <ul className="nav-tab-filter" role="tablist">
                <li className="nav-tab-item" role="presentation">
                  {" "}
                  <a
                    href="#gridLayout"
                    className={`nav-link-item${isGrid ? " active" : ""}`}
                    data-bs-toggle="tab"
                  >
                    {" "}
                    <svg
                      className="icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {" "}
                      <path
                        d="M4.54883 5.90508C4.54883 5.1222 5.17272 4.5 5.91981 4.5C6.66686 4.5 7.2908 5.12221 7.2908 5.90508C7.2908 6.68801 6.66722 7.3101 5.91981 7.3101C5.17241 7.3101 4.54883 6.68801 4.54883 5.90508Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M10.6045 5.90508C10.6045 5.12221 11.2284 4.5 11.9755 4.5C12.7229 4.5 13.3466 5.1222 13.3466 5.90508C13.3466 6.68789 12.7227 7.3101 11.9755 7.3101C11.2284 7.3101 10.6045 6.68794 10.6045 5.90508Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M19.4998 5.90514C19.4998 6.68797 18.8757 7.31016 18.1288 7.31016C17.3818 7.31016 16.7578 6.68794 16.7578 5.90508C16.7578 5.12211 17.3813 4.5 18.1288 4.5C18.8763 4.5 19.4998 5.12215 19.4998 5.90514Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M7.24249 12.0098C7.24249 12.7927 6.61849 13.4148 5.87133 13.4148C5.12411 13.4148 4.5 12.7926 4.5 12.0098C4.5 11.2268 5.12419 10.6045 5.87133 10.6045C6.61842 10.6045 7.24249 11.2267 7.24249 12.0098Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M13.2976 12.0098C13.2976 12.7927 12.6736 13.4148 11.9266 13.4148C11.1795 13.4148 10.5557 12.7928 10.5557 12.0098C10.5557 11.2266 11.1793 10.6045 11.9266 10.6045C12.6741 10.6045 13.2976 11.2265 13.2976 12.0098Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M19.4516 12.0098C19.4516 12.7928 18.828 13.4148 18.0807 13.4148C17.3329 13.4148 16.709 12.7926 16.709 12.0098C16.709 11.2268 17.3332 10.6045 18.0807 10.6045C18.8279 10.6045 19.4516 11.2266 19.4516 12.0098Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M4.54297 18.0945C4.54297 17.3116 5.16709 16.6895 5.9143 16.6895C6.66137 16.6895 7.28523 17.3114 7.28523 18.0945C7.28523 18.8776 6.66139 19.4996 5.9143 19.4996C5.16714 19.4996 4.54297 18.8771 4.54297 18.0945Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M10.5986 18.0945C10.5986 17.3116 11.2227 16.6895 11.97 16.6895C12.7169 16.6895 13.3409 17.3115 13.3409 18.0945C13.3409 18.8776 12.7169 19.4996 11.97 19.4996C11.2225 19.4996 10.5986 18.8772 10.5986 18.0945Z"
                        stroke="#A3ABB0"
                      />{" "}
                      <path
                        d="M16.752 18.0945C16.752 17.3115 17.376 16.6895 18.1229 16.6895C18.8699 16.6895 19.4939 17.3115 19.4939 18.0945C19.4939 18.8776 18.8702 19.4996 18.1229 19.4996C17.376 19.4996 16.752 18.8772 16.752 18.0945Z"
                        stroke="#A3ABB0"
                      />{" "}
                    </svg>{" "}
                  </a>{" "}
                </li>
                <li className="nav-tab-item" role="presentation">
                  {" "}
                  <a
                    href="#listLayout"
                    className={`nav-link-item${isGrid ? "" : " active"}`}
                    data-bs-toggle="tab"
                  >
                    {" "}
                    <svg
                      className="icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {" "}
                      <path
                        d="M19.2016 17.8316H8.50246C8.0615 17.8316 7.7041 17.4742 7.7041 17.0332C7.7041 16.5923 8.0615 16.2349 8.50246 16.2349H19.2013C19.6423 16.2349 19.9997 16.5923 19.9997 17.0332C19.9997 17.4742 19.6426 17.8316 19.2016 17.8316Z"
                        fill="#A3ABB0"
                      />{" "}
                      <path
                        d="M19.2016 12.8199H8.50246C8.0615 12.8199 7.7041 12.4625 7.7041 12.0215C7.7041 11.5805 8.0615 11.2231 8.50246 11.2231H19.2013C19.6423 11.2231 19.9997 11.5805 19.9997 12.0215C20 12.4625 19.6426 12.8199 19.2016 12.8199Z"
                        fill="#A3ABB0"
                      />{" "}
                      <path
                        d="M19.2016 7.80913H8.50246C8.0615 7.80913 7.7041 7.45173 7.7041 7.01077C7.7041 6.5698 8.0615 6.2124 8.50246 6.2124H19.2013C19.6423 6.2124 19.9997 6.5698 19.9997 7.01077C19.9997 7.45173 19.6426 7.80913 19.2016 7.80913Z"
                        fill="#A3ABB0"
                      />{" "}
                      <path
                        d="M5.0722 8.1444C5.66436 8.1444 6.1444 7.66436 6.1444 7.0722C6.1444 6.48004 5.66436 6 5.0722 6C4.48004 6 4 6.48004 4 7.0722C4 7.66436 4.48004 8.1444 5.0722 8.1444Z"
                        fill="#A3ABB0"
                      />{" "}
                      <path
                        d="M5.0722 13.0941C5.66436 13.0941 6.1444 12.6141 6.1444 12.0219C6.1444 11.4297 5.66436 10.9497 5.0722 10.9497C4.48004 10.9497 4 11.4297 4 12.0219C4 12.6141 4.48004 13.0941 5.0722 13.0941Z"
                        fill="#A3ABB0"
                      />{" "}
                      <path
                        d="M5.0722 18.0433C5.66436 18.0433 6.1444 17.5633 6.1444 16.9711C6.1444 16.379 5.66436 15.8989 5.0722 15.8989C4.48004 15.8989 4 16.379 4 16.9711C4 17.5633 4.48004 18.0433 5.0722 18.0433Z"
                        fill="#A3ABB0"
                      />{" "}
                    </svg>{" "}
                  </a>{" "}
                </li>
              </ul>{" "}
              <NiceSelect
                className="select-filter list-page"
                options={[
                  { value: "1", label: "Show: 50" },
                  { value: "2", label: "Show: 30" },
                  { value: "3", label: "Show: 10" },
                ]}
                defaultValue="3"
              />{" "}
              <NiceSelect
                className="select-filter list-sort"
                options={[
                  { value: "default", label: "Sort by (Default)" },
                  { value: "new", label: "Newest" },
                  { value: "old", label: "Oldest" },
                ]}
                defaultValue="default"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="row">
            {" "}
            <div className="col-xl-4 col-lg-5">
              {" "}
              <div className="widget-sidebar fixed-sidebar">
                {" "}
                <div className="flat-tab flat-tab-form widget-filter-search widget-box">
                  {" "}
                  <ul className="nav-tab-form" role="tablist">
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
                          <div className="wd-filter-select">
                            {" "}
                            <div className="inner-group">
                              {" "}
                              <div className="box">
                                {" "}
                                <div className="form-style">
                                  {" "}
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Type keyword...."
                                    defaultValue=""
                                    name="s"
                                    title="Search for"
                                    required
                                  />{" "}
                                </div>{" "}
                                <div className="form-style">
                                  {" "}
                                  <div className="group-ip ip-icon">
                                    {" "}
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Location"
                                      defaultValue=""
                                      name="s"
                                      title="Search for"
                                      required
                                    />{" "}
                                    <a
                                      href="#"
                                      className="icon-right icon-location"
                                    ></a>{" "}
                                  </div>{" "}
                                </div>{" "}
                                <div className="form-style">
                                  {" "}
                                  <div className="group-select">
                                    {" "}
                                    <NiceSelect
                                      options={[
                                        { value: "villa", label: "Villa" },
                                        { value: "studio", label: "Studio" },
                                        { value: "office", label: "Office" },
                                      ]}
                                    />{" "}
                                  </div>{" "}
                                </div>{" "}
                                <div className="form-style box-select">
                                  {" "}
                                  <NiceSelect
                                    options={[
                                      { value: "2", label: "1" },
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
                                <div className="form-style box-select">
                                  {" "}
                                  <NiceSelect
                                    options={[
                                      { value: "all", label: "All" },
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
                                    defaultValue="4"
                                  />{" "}
                                </div>{" "}
                                <div className="form-style box-select">
                                  {" "}
                                  <NiceSelect
                                    options={[
                                      { value: "1", label: "All" },
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
                                    defaultValue="4"
                                  />{" "}
                                </div>{" "}
                              </div>{" "}
                              <div className="box">
                                {" "}
                                <RangeSliderWidget
                                  title="Price:"
                                  min={100}
                                  max={650000}
                                  start={[100, 650000]}
                                  format={{ prefix: "$" }}
                                  inputNames={["min-value", "max-value"]}
                                  className="form-style widget-price"
                                />{" "}
                                <RangeSliderWidget
                                  title="Size:"
                                  min={20}
                                  max={2000}
                                  start={[500, 1500]}
                                  format={{ postfix: " SqFt" }}
                                  inputNames={["min-value2", "max-value2"]}
                                  className="form-style widget-price wd-price-2"
                                />{" "}
                              </div>{" "}
                              <div className="box">
                                {" "}
                                <div className="form-style wd-amenities">
                                  {" "}
                                  <div className="group-checkbox">
                                    {" "}
                                    <h6 className="title text-black-2">
                                      Amenities:
                                    </h6>{" "}
                                    <div className="group-amenities">
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
                                      <fieldset className="amenities-item">
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
                                          Disabled Access
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb4"
                                          defaultChecked=""
                                        />{" "}
                                        <label
                                          htmlFor="cb4"
                                          className="text-cb-amenities"
                                        >
                                          Floor
                                        </label>{" "}
                                      </fieldset>{" "}
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
                                          Heating
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb6"
                                        />{" "}
                                        <label
                                          htmlFor="cb6"
                                          className="text-cb-amenities"
                                        >
                                          Renovation
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Window Type
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Cable TV
                                        </label>{" "}
                                      </fieldset>{" "}
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
                                          Elevator
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb11"
                                        />{" "}
                                        <label
                                          htmlFor="cb11"
                                          className="text-cb-amenities"
                                        >
                                          Intercom
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Security
                                        </label>{" "}
                                      </fieldset>{" "}
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
                                          Search property
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Ceiling Height
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Fence
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Fence
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb17"
                                          defaultChecked=""
                                        />{" "}
                                        <label
                                          htmlFor="cb17"
                                          className="text-cb-amenities"
                                        >
                                          Garage
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Parking
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Construction Year
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Fireplace
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
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
                                          Garden
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb23"
                                        />{" "}
                                        <label
                                          htmlFor="cb23"
                                          className="text-cb-amenities"
                                        >
                                          Pet Friendly
                                        </label>{" "}
                                      </fieldset>{" "}
                                      <fieldset className="amenities-item">
                                        {" "}
                                        <input
                                          type="checkbox"
                                          className="tf-checkbox style-1"
                                          id="cb24"
                                        />{" "}
                                        <label
                                          htmlFor="cb24"
                                          className="text-cb-amenities"
                                        >
                                          WiFi
                                        </label>{" "}
                                      </fieldset>{" "}
                                    </div>{" "}
                                  </div>{" "}
                                </div>{" "}
                              </div>{" "}
                              <div className="form-style">
                                {" "}
                                <button
                                  type="submit"
                                  className="tf-btn btn-view primary hover-btn-view"
                                >
                                  Find Properties{" "}
                                  <span className="icon icon-arrow-right2"></span>
                                </button>{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>{" "}
                        </form>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="widget-box box-latest-property">
                  {" "}
                  <h5 className="fw-6 title">Latest Propeties</h5>{" "}
                  <ul>
                    <li className="latest-property-item">
                      {" "}
                      <Link to="/property-details-v1" className="images-style">
                        {" "}
                        <img src="/images/home/house-8.jpg" alt="img" />{" "}
                      </Link>{" "}
                      <div className="content">
                        {" "}
                        <div className="text-capitalize text-btn">
                          <Link to="/property-details-v1" className="link">
                            Casa Lomas de Machalí Machas
                          </Link>
                        </div>{" "}
                        <ul className="meta-list mt-6">
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
                        <div className="mt-10 text-btn">$7250,00</div>{" "}
                      </div>{" "}
                    </li>
                    <li className="latest-property-item">
                      {" "}
                      <Link to="/property-details-v1" className="images-style">
                        {" "}
                        <img src="/images/home/house-3.jpg" alt="img" />{" "}
                      </Link>{" "}
                      <div className="content">
                        {" "}
                        <div className="text-capitalize text-btn">
                          <Link to="/property-details-v1" className="link">
                            Casa Lomas de Machalí Machas
                          </Link>
                        </div>{" "}
                        <ul className="meta-list mt-6">
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
                        <div className="mt-10 text-btn">$7250,00</div>{" "}
                      </div>{" "}
                    </li>
                    <li className="latest-property-item">
                      {" "}
                      <Link to="/property-details-v1" className="images-style">
                        {" "}
                        <img src="/images/home/house-28.jpg" alt="img" />{" "}
                      </Link>{" "}
                      <div className="content">
                        {" "}
                        <div className="text-capitalize text-btn">
                          <Link to="/property-details-v1" className="link">
                            Casa Lomas de Machalí Machas
                          </Link>
                        </div>{" "}
                        <ul className="meta-list mt-6">
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
                        <div className="mt-10 text-btn">$7250,00</div>{" "}
                      </div>{" "}
                    </li>
                    <li className="latest-property-item">
                      {" "}
                      <Link to="/property-details-v1" className="images-style">
                        {" "}
                        <img src="/images/home/house-29.jpg" alt="img" />{" "}
                      </Link>{" "}
                      <div className="content">
                        {" "}
                        <div className="text-capitalize text-btn">
                          <Link to="/property-details-v1" className="link">
                            Casa Lomas de Machalí Machas
                          </Link>
                        </div>{" "}
                        <ul className="meta-list mt-6">
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
                        <div className="mt-10 text-btn">$7250,00</div>{" "}
                      </div>{" "}
                    </li>
                    <li className="latest-property-item">
                      {" "}
                      <Link to="/property-details-v1" className="images-style">
                        {" "}
                        <img src="/images/home/house-19.jpg" alt="img" />{" "}
                      </Link>{" "}
                      <div className="content">
                        {" "}
                        <div className="text-capitalize text-btn">
                          <Link to="/property-details-v1" className="link">
                            Casa Lomas de Machalí Machas
                          </Link>
                        </div>{" "}
                        <ul className="meta-list mt-6">
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
                        <div className="mt-10 text-btn">$7250,00</div>{" "}
                      </div>{" "}
                    </li>
                  </ul>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="col-xl-8 col-lg-7 flat-animate-tab">
              {" "}
              <div className="tab-content">
                {" "}
                <div
                  className={`tab-pane${isGrid ? " active show" : ""}`}
                  id="gridLayout"
                  role="tabpanel"
                >
                  {" "}
                  <div className="row">
                    {" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[6]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[7]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[35]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[36]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[37]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[29]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[44]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[45]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[46]} />{" "}
                    </div>{" "}
                    <div className="col-md-6">
                      {" "}
                      <PropertyCard property={PROPERTIES[6]} />{" "}
                    </div>{" "}
                  </div>{" "}
                  <ul className="wd-navigation mt-20">
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
                <div
                  className={`tab-pane${isGrid ? "" : " active show"}`}
                  id="listLayout"
                  role="tabpanel"
                >
                  {" "}
                  <div className="row">
                    {" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[51]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[52]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[53]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[54]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[55]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[56]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[57]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[58]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[59]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                    <div className="col-md-12">
                      {" "}
                      <PropertyCard
                        property={PROPERTIES[60]}
                        className="list-style-1 list-style-2 line"
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <ul className="wd-navigation mt-20">
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
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </>
  );
}
