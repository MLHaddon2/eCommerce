const SignupForm = ({ inputs, handleChange, handleSubmit, loading = false }) => {
  return (
    <form onSubmit={handleSubmit}>
      <h3>Signup</h3>
      <div className="form-group">
          <input
            type="text"
            name="firstName"
            className="form-control"
            autoComplete="given-name"
            onChange={handleChange}
            value={inputs.firstName}
            placeholder="First Name"
            required
          />
      </div>
      <div className="form-group">
          <input
            type="text"
            name="lastName"
            className="form-control"
            autoComplete="family-name"
            onChange={handleChange}
            value={inputs.lastName}
            placeholder="Last Name"
            required
          />
      </div>
      <div className="form-group">
          <input
            type="text"
            name="address"
            className="form-control"
            autoComplete="address"
            onChange={handleChange}
            value={inputs.address}
            placeholder="Address"
          />
      </div>
      <div className="form-group">
          <input
            type="text"
            name="username"
            className="form-control"
            autoComplete="username"
            onChange={handleChange}
            value={inputs.username}
            placeholder="Username"
            required
          />
      </div>
      <div className="form-group">
          <input
            type="email"
            name="email"
            className="form-control"
            autoComplete="email"
            onChange={handleChange}
            value={inputs.email}
            placeholder="Email"
            required
          />
      </div>
      <div className="form-group">
          <input
            type="password"
            name="password"
            className="form-control"
            autoComplete="new-password"
            onChange={handleChange}
            value={inputs.password}
            placeholder="Password"
            required
          />
      </div>
      <div className="form-group">
          <input
            type="password"
            name="confPwd"
            className="form-control"
            autoComplete="new-password"
            onChange={handleChange}
            value={inputs.confPwd}
            placeholder="Confirm Password"
            required
          />
      </div>
      <button
        type="submit"
        className="btn btn-dark btn-lg btn-block"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Submit'}
      </button>
    </form>
  );
};

export default SignupForm;
