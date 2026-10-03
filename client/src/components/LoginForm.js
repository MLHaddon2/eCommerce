const LoginForm = ({ inputs, handleChange, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit}>
      <h3>Log in</h3>
      <div className="form-group mb-2">
          <label htmlFor="loginUsername">Username</label>
          <input
            type="text"
            id="loginUsername"
            name="username"
            className="form-control"
            autoComplete="username"
            onChange={handleChange}
            value={inputs.username}
            required
          />
      </div>
      <div className="form-group mb-2">
          <label htmlFor="loginPassword">Password</label>
          <input
            type="password"
            id="loginPassword"
            name="password"
            className="form-control"
            autoComplete="current-password"
            onChange={handleChange}
            value={inputs.password}
            required
          />
      </div>
      <button type="submit" className="btn btn-dark btn-lg btn-block mt-3">Sign in</button>
    </form>
  );
}

export default LoginForm;
