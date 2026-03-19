#Use an image with JDK to build the app
FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app

#Copy maven files and download dependencies
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Fix line endings and make mvnw executable
RUN dos2unix mvnw || sed -i 's/\r$//' mvnw
RUN chmod +x mvnw

#cache dependencies offline
RUN ./mvnw dependency:go-offline

#Copy source and build the jar
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Final tiny image to run the app
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

#create non-root user and group
RUN addgroup -S spring && adduser -S spring -G spring

#copy the build artifact and set permissions
COPY --from=build /app/target/*.jar app.jar

#change ownership to the non-root user
RUN chown spring:spring app.jar

#switch to non-root user
USER spring:spring


EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:InitialRAMPercentage=50.0", "-jar", "app.jar"]