# Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run app.py when the container launches
# Using gunicorn for a more production-ready setup is common,
# but for simplicity, Flask's development server is used here.
# For production: CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
CMD ["flask", "run"]

