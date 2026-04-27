const LoginForm = ({ inputs, handleChange, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit} className="mw-50 m-auto" style={{width: "400px"}}>
      <h3>Log in</h3>
      <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            name="username"
            className="form-control" 
            autoComplete="username"
            onChange={handleChange}
            placeholder= {inputs.username}
          />
      </div>
      <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            name="password"
            className="form-control"
            autoComplete="password"
            onChange={handleChange} 
            placeholder={inputs.password}
          />
      </div>
      <div className="form-group">
          <div className="custom-control custom-checkbox">
              <input 
                type="checkbox" 
                className="custom-control-input" 
                id="customCheck1" 
              />
              <label className="custom-control-label" htmlFor="customCheck1">Remember me</label>
          </div>
      </div>
      <button type="submit" className="btn btn-dark btn-lg btn-block">Sign in</button>
    </form>
  );
}

export default LoginForm;