const SignupForm = ({ inputs, handleChange, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      <h3>Signup</h3>
      <div className="form-group">
          <input 
            type="text" 
            name="firstName"
            className="form-control" 
            autoComplete="First Name"
            onChange={handleChange}
            placeholder= {inputs.firstName || "First Name"}
          />
      </div>
      <div className="form-group">
          <input 
            type="text" 
            name="lastName"
            className="form-control" 
            autoComplete="Last Name"
            onChange={handleChange}
            placeholder= {inputs.lastName || "Last Name"}
          />
      </div>
      <div className="form-group">
          <input 
            type="text" 
            name="address"
            className="form-control" 
            autoComplete="Address"
            onChange={handleChange}
            placeholder= {inputs.address || "Address"}
          />
      </div>
      <div className="form-group">
          <input 
            type="text" 
            name="username"
            className="form-control" 
            autoComplete="username"
            onChange={handleChange}
            placeholder= {inputs.username || "Username"}
          />
      </div>
      <div className="form-group">
          <input 
            type="email" 
            name="email"
            className="form-control" 
            autoComplete="email"
            onChange={handleChange}
            placeholder={inputs.email || "Email :Fake emails are fine"} 
          />
      </div>
      <div className="form-group">
          <input 
            type="password" 
            name="password"
            className="form-control"
            autoComplete="password"
            onChange={handleChange} 
            placeholder={inputs.password || "Password"}
          />
      </div>
      <div className="form-group">
          <input 
            type="password" 
            name="confPwd"
            className="form-control"
            onChange={handleChange} 
            placeholder={inputs.confPwd || "Confirm Password"}
          />
      </div>
      <button type="submit" className="btn btn-dark btn-lg btn-block">Submit</button>
    </form>
  );
};

export default SignupForm;
