import PasswordField from "../components/forms/PasswordField";

export default function MyProfile() {
  return (
    <>
      {" "}
      <div className="widget-box-2">
        {" "}
        <div className="box">
          {" "}
          <h5 className="title">Account Settings</h5>{" "}
          <div className="box-agent-account">
            {" "}
            <h6>Agent Account</h6>{" "}
            <p className="note">
              Your current account type is set to agent, if you want to remove
              your agent account, and return to normal account, you must click
              the button below
            </p>{" "}
            <a href="#" className="tf-btn primary">
              Remove Agent Account
            </a>{" "}
          </div>{" "}
        </div>{" "}
        <div className="box">
          {" "}
          <h5 className="title">Avatar</h5>{" "}
          <div className="box-agent-avt">
            {" "}
            <div className="avatar">
              {" "}
              <img
                src="/images/avatar/account.jpg"
                alt="avatar"
                loading="lazy"
                width="128"
                height="128"
              />{" "}
            </div>{" "}
            <div className="content uploadfile">
              {" "}
              <p>Upload a new avatar</p>{" "}
              <div className="box-ip">
                {" "}
                <input type="file" className="ip-file" />{" "}
              </div>{" "}
              <p>JPEG 100x100</p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="box">
          {" "}
          <h5 className="title">Agent Poster</h5>{" "}
          <div className="box-agent-avt">
            {" "}
            <div className="img-poster">
              {" "}
              <img
                src="/images/avatar/account-2.jpg"
                alt="avatar"
                loading="lazy"
              />{" "}
            </div>{" "}
            <div className="content uploadfile">
              {" "}
              <p>Upload a new poster</p>{" "}
              <div className="box-ip">
                {" "}
                <input type="file" className="ip-file" />{" "}
              </div>{" "}
              <span>JPEG 100x100</span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <h5 className="title">Information</h5>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Full name:<span>*</span>
          </label>{" "}
          <input
            type="text"
            defaultValue="Demo Agent"
            className="form-control style-1"
          />{" "}
        </div>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Description:<span>*</span>
          </label>{" "}
          <textarea
            defaultValue={
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            }
          />{" "}
        </div>{" "}
        <div className="box grid-4 gap-30">
          {" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Your Company:<span>*</span>
            </label>{" "}
            <input
              type="text"
              defaultValue="Your Company"
              className="form-control style-1"
            />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Position:<span>*</span>
            </label>{" "}
            <input
              type="text"
              defaultValue="Your Company"
              className="form-control style-1"
            />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Office Number:<span>*</span>
            </label>{" "}
            <input
              type="number"
              defaultValue="1332565894"
              className="form-control style-1"
            />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Office Address:<span>*</span>
            </label>{" "}
            <input
              type="text"
              defaultValue="10 Bringhurst St, Houston, TX"
              className="form-control style-1"
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="box grid-4 gap-30 box-info-2">
          {" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Job:<span>*</span>
            </label>{" "}
            <input
              type="text"
              defaultValue="Realter"
              className="form-control style-1"
            />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Email address:<span>*</span>
            </label>{" "}
            <input
              type="text"
              defaultValue="themeflat@gmail.com"
              className="form-control style-1"
            />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Your Phone:<span>*</span>
            </label>{" "}
            <input
              type="number"
              defaultValue="1332565894"
              className="form-control style-1"
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Location:<span>*</span>
          </label>{" "}
          <input
            type="text"
            defaultValue="634 E 236th St, Bronx, NY 10466"
            className="form-control style-1"
          />{" "}
        </div>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Facebook:<span>*</span>
          </label>{" "}
          <input
            type="text"
            defaultValue="#"
            className="form-control style-1"
          />{" "}
        </div>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Twitter:<span>*</span>
          </label>{" "}
          <input
            type="text"
            defaultValue="#"
            className="form-control style-1"
          />{" "}
        </div>{" "}
        <div className="box box-fieldset">
          {" "}
          <label>
            Linkedin:<span>*</span>
          </label>{" "}
          <input
            type="text"
            defaultValue="#"
            className="form-control style-1"
          />{" "}
        </div>{" "}
        <div className="box">
          {" "}
          <a href="#" className="tf-btn primary">
            Save & Update
          </a>{" "}
        </div>{" "}
        <h5 className="title">Change password</h5>{" "}
        <div className="box grid-3 gap-30">
          {" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Old Password:<span>*</span>
            </label>{" "}
            <PasswordField />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              New Password:<span>*</span>
            </label>{" "}
            <PasswordField />{" "}
          </div>{" "}
          <div className="box-fieldset">
            {" "}
            <label>
              Confirm Password:<span>*</span>
            </label>{" "}
            <PasswordField />{" "}
          </div>{" "}
        </div>{" "}
        <div className="box">
          {" "}
          <a href="#" className="tf-btn primary">
            Update Password
          </a>{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
}
