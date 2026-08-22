import {
  PhotoUploader,
  FloorImageUploader,
} from "../components/forms/MediaUploader";
import NiceSelect from "../components/common/NiceSelect";

export default function AddProperty() {
  return (
    <>
      {" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Upload Media</h5>{" "}
        <PhotoUploader
          images={[
            "/images/home/house-18.jpg",
            "/images/home/house-23.jpg",
            "/images/home/house-14.jpg",
            "/images/home/house-32.jpg",
            "/images/home/house-33.jpg",
          ]}
        />{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Information</h5>{" "}
        <div className="box-info-property">
          {" "}
          <fieldset className="box box-fieldset">
            {" "}
            <label>
              {" "}
              Title:<span>*</span>{" "}
            </label>{" "}
            <input
              type="text"
              className="form-control"
              placeholder="Choose"
            />{" "}
          </fieldset>{" "}
          <fieldset className="box box-fieldset">
            {" "}
            <label>Description:</label>{" "}
            <textarea
              className="textarea"
              placeholder="Your Decscription"
            />{" "}
          </fieldset>{" "}
          <div className="box grid-3 gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Full Address:<span>*</span>{" "}
              </label>{" "}
              <input
                type="text"
                className="form-control"
                placeholder="Enter property full address"
              />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Zip Code:<span>*</span>{" "}
              </label>{" "}
              <input
                type="text"
                className="form-control"
                placeholder="Enter property zip code"
              />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Country:<span>*</span>{" "}
              </label>{" "}
              <NiceSelect
                options={[
                  { value: "1", label: "United States" },
                  { value: "2", label: "United Kingdom" },
                  { value: "3", label: "Russia" },
                ]}
                defaultValue="1"
              />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="box grid-2 gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Province/State:<span>*</span>{" "}
              </label>{" "}
              <NiceSelect
                options={[
                  { value: "1", label: "None" },
                  { value: "2", label: "Texas" },
                  { value: "3", label: "New York" },
                ]}
                defaultValue="1"
              />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Neighborhood:<span>*</span>{" "}
              </label>{" "}
              <NiceSelect
                options={[
                  { value: "1", label: "None" },
                  { value: "2", label: "Little Italy" },
                  { value: "3", label: "Bedford Park" },
                ]}
                defaultValue="1"
              />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="box box-fieldset">
            {" "}
            <label>
              Location:<span>*</span>
            </label>{" "}
            <div className="box-ip">
              {" "}
              <input
                type="text"
                className="form-control"
                defaultValue="None"
              />{" "}
              <a href="#" className="btn-location">
                <i className="icon icon-location"></i>
              </a>{" "}
            </div>{" "}
            <iframe
              className="map"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d135905.11693909427!2d-73.95165795400088!3d41.17584829642291!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1727094281524!5m2!1sen!2s"
              height="456"
              style={{ border: "0" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Price</h5>{" "}
        <div className="box-price-property">
          {" "}
          <div className="box grid-2 gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                Price:<span>*</span>
              </label>{" "}
              <input
                type="text"
                className="form-control"
                placeholder="Example value: 12345.67"
              />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Unit Price:<span>*</span>{" "}
              </label>{" "}
              <NiceSelect
                options={[
                  { value: "1", label: "None" },
                  { value: "2", label: "1000" },
                  { value: "3", label: "2000" },
                ]}
                defaultValue="1"
              />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="grid-2 gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                Before Price Label:<span>*</span>{" "}
              </label>{" "}
              <input type="text" className="form-control" />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>
                {" "}
                After Price Label:<span>*</span>{" "}
              </label>{" "}
              <input type="text" className="form-control" />{" "}
            </fieldset>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Addtional Infomation</h5>{" "}
        <div className="box grid-3 gap-30">
          {" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Property Type:<span>*</span>{" "}
            </label>{" "}
            <NiceSelect
              options={[
                { value: "1", label: "Apartment" },
                { value: "2", label: "Villa" },
                { value: "3", label: "Studio" },
                { value: "4", label: "Studio" },
                { value: "5", label: "Office" },
                { value: "6", label: "Townhouse" },
              ]}
            />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Property Status:<span>*</span>{" "}
            </label>{" "}
            <NiceSelect
              options={[
                { value: "1", label: "For Rent" },
                { value: "2", label: "For Sale" },
              ]}
            />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Property Label:<span>*</span>{" "}
            </label>{" "}
            <NiceSelect
              options={[
                { value: "1", label: "New Listing" },
                { value: "2", label: "Open House" },
              ]}
            />{" "}
          </fieldset>{" "}
        </div>{" "}
        <div className="box grid-3 gap-30">
          {" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Size (SqFt):<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Land Area (SqFt):<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Property ID:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
        </div>{" "}
        <div className="box grid-3 gap-30">
          {" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Rooms:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Bedrooms:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Bathrooms:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
        </div>{" "}
        <div className="box grid-3 gap-30">
          {" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Garages:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Garages Size (SqFt):<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
          <fieldset className="box-fieldset">
            {" "}
            <label>
              {" "}
              Year Built:<span>*</span>{" "}
            </label>{" "}
            <input type="text" className="form-control" />{" "}
          </fieldset>{" "}
        </div>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">
          Amenities<span>*</span>
        </h5>{" "}
        <div className="box-amenities-property">
          {" "}
          <div className="box-amenities">
            {" "}
            <div className="title-amenities text-btn">Home safety:</div>{" "}
            <div className="list-amenities">
              {" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1"
                  id="cb1"
                  defaultChecked=""
                />{" "}
                <label htmlFor="cb1" className="text-cb-amenities">
                  Smoke alarm
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb2"
                />{" "}
                <label htmlFor="cb2" className="text-cb-amenities">
                  Self check-in with lockbox
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb3"
                  defaultChecked=""
                />{" "}
                <label htmlFor="cb3" className="text-cb-amenities">
                  Carbon monoxide alarm
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb4"
                />{" "}
                <label htmlFor="cb4" className="text-cb-amenities">
                  Security cameras
                </label>{" "}
              </fieldset>{" "}
            </div>{" "}
          </div>{" "}
          <div className="box-amenities">
            {" "}
            <div className="title-amenities text-btn">Bedroom</div>{" "}
            <div className="list-amenities">
              {" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1"
                  id="cb-bed1"
                />{" "}
                <label htmlFor="cb-bed1" className="text-cb-amenities">
                  Hangers
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-bed2"
                />{" "}
                <label htmlFor="cb-bed2" className="text-cb-amenities">
                  Extra pillows & blankets
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-bed3"
                />{" "}
                <label htmlFor="cb-bed3" className="text-cb-amenities">
                  Bed linens
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-bed4"
                />{" "}
                <label htmlFor="cb-bed4" className="text-cb-amenities">
                  TV with standard cable
                </label>{" "}
              </fieldset>{" "}
            </div>{" "}
          </div>{" "}
          <div className="box-amenities">
            {" "}
            <div className="title-amenities text-btn">Kitchen:</div>{" "}
            <div className="list-amenities">
              {" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1"
                  id="cb-kit1"
                />{" "}
                <label htmlFor="cb-kit1" className="text-cb-amenities">
                  Refrigerator
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-kit2"
                />{" "}
                <label htmlFor="cb-kit2" className="text-cb-amenities">
                  Dishwasher
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-kit3"
                />{" "}
                <label htmlFor="cb-kit3" className="text-cb-amenities">
                  Microwave
                </label>{" "}
              </fieldset>{" "}
              <fieldset className="amenities-item">
                {" "}
                <input
                  type="checkbox"
                  className="tf-checkbox style-1 primary"
                  id="cb-kit4"
                />{" "}
                <label htmlFor="cb-kit4" className="text-cb-amenities">
                  Coffee maker
                </label>{" "}
              </fieldset>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Virtual Tour 360</h5>{" "}
        <div className="box-radio-check">
          {" "}
          <div className="text-btn mb-16">Virtual Tour Type:</div>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio"
              id="radio1"
              defaultChecked=""
            />{" "}
            <label htmlFor="radio1" className="text-radio">
              Embedded code
            </label>{" "}
          </fieldset>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio"
              id="radio2"
            />{" "}
            <label htmlFor="radio2" className="text-radio">
              Upload image
            </label>{" "}
          </fieldset>{" "}
        </div>{" "}
        <fieldset className="box-fieldset">
          {" "}
          <label>Embedded Code Virtual 360</label>{" "}
          <textarea className="textarea" />{" "}
        </fieldset>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Videos</h5>{" "}
        <fieldset className="box-fieldset">
          {" "}
          <label className="text-btn">Video URL:</label>{" "}
          <input
            type="text"
            className="form-control"
            placeholder="Youtube, vimeo url"
          />{" "}
        </fieldset>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Floors</h5>{" "}
        <div className="box-radio-check">
          {" "}
          <div className="text-btn mb-16">Enable Floor Plan:</div>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio2"
              id="radio3"
              defaultChecked=""
            />{" "}
            <label htmlFor="radio3" className="text-radio">
              Enable
            </label>{" "}
          </fieldset>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio2"
              id="radio4"
            />{" "}
            <label htmlFor="radio4" className="text-radio">
              Disable
            </label>{" "}
          </fieldset>{" "}
        </div>{" "}
        <div className="box-floor-property file-delete">
          {" "}
          <div className="top d-flex justify-content-between align-items-center">
            {" "}
            <h6>Floor 1:</h6>{" "}
            <a href="#" className="remove-file">
              <span className="icon icon-close2"></span>
            </a>{" "}
          </div>{" "}
          <fieldset className="box box-fieldset">
            {" "}
            <label>Floor Name:</label>{" "}
            <input type="text" className="form-control style-1" />{" "}
          </fieldset>{" "}
          <div className="grid-2 box gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Floor Price (Only Digits):</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Price Postfix:</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="grid-2 box gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Floor Size (Only Digits):</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Size Postfix:</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="grid-2 box gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Bedrooms:</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Bathrooms:</label>{" "}
              <input type="text" className="form-control style-1" />{" "}
            </fieldset>{" "}
          </div>{" "}
          <div className="grid-2 box gap-30">
            {" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Floor Image:</label> <FloorImageUploader />{" "}
            </fieldset>{" "}
            <fieldset className="box-fieldset">
              {" "}
              <label>Description:</label> <textarea className="textarea" />{" "}
            </fieldset>{" "}
          </div>{" "}
        </div>{" "}
        <div className="text-center">
          {" "}
          <a href="#" className="btn-add-floor">
            <span className="icon icon-plus"></span>
          </a>{" "}
        </div>{" "}
      </div>{" "}
      <div className="widget-box-2 mb-20">
        {" "}
        <h5 className="title">Agent Infomation</h5>{" "}
        <div className="box-radio-check">
          {" "}
          <div className="text-btn mb-16">
            Choose type agent information?
          </div>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio3"
              id="radio5"
              defaultChecked=""
            />{" "}
            <label htmlFor="radio5" className="text-radio">
              Your current user information
            </label>{" "}
          </fieldset>{" "}
          <fieldset className="fieldset-radio">
            {" "}
            <input
              type="radio"
              className="tf-checkbox style-1"
              name="radio3"
              id="radio6"
            />{" "}
            <label htmlFor="radio6" className="text-radio">
              Other contact
            </label>{" "}
          </fieldset>{" "}
        </div>{" "}
      </div>{" "}
      <div className="box-btn">
        {" "}
        <a href="#" className="tf-btn primary">
          Add Property
        </a>{" "}
        <a href="#" className="tf-btn btn-line">
          Save & Preview
        </a>{" "}
      </div>{" "}
    </>
  );
}
